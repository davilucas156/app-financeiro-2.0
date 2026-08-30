# Plano — B1 e B2, o que sai do mês

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B1 (a conta do que sai, pura) e B2 (perguntar ao banco quem formou o mês)
**Spec:** `specs/14-remover-um-mes.md`, Descobertas 3 e 4

⚠ **Nada aqui apaga nada, e nada aqui é chamado por ninguém.** As duas peças
sobem escritas e testadas; a fase C é que ganha o `delete`, e a D o botão.

---

## A decisão que molda o plano: aqui a contagem **não** filtra `excluido`

Toda consulta deste projeto que conta lançamento carrega
`ne(transactions.status, "excluido")` — o `somarOMes`, o `historicoDosMeses`, o
`coberturaDosMeses`, e a própria contagem de meses que a fase A acabou de mexer.
O motivo é sempre o mesmo: pagamento de fatura é `excluido` desde a spec 02, e
contá-lo faria o gasto do cartão aparecer duas vezes.

⚠ **Aqui esse reflexo dá a resposta errada, e ele é forte** — está em cinco
arquivos e é a primeira coisa que a mão escreve.

A diferença é a pergunta. As outras consultas perguntam _"quanto foi gasto"_;
esta pergunta _"o que desaparece"_. Um envio com 53 linhas das quais 5 são
pagamento de fatura **some inteiro**, com as 5 junto. Uma confirmação dizendo
"48 lançamentos" estaria subestimando o estrago — e subestimar o estrago é o
único erro que uma tela de confirmação não pode cometer.

Fica escrito no docblock da consulta, porque a próxima pessoa que ler vai achar
que é esquecimento.

---

## Arquivos a criar

### `src/features/painel/remover-o-mes/oQueSaiDoMes.ts` `INFRA`

Pura, sem `server-only`. Recebe o mês pedido e as linhas cruas — um envio
aparece **uma vez por mês em que tem lançamento**, e é essa repetição que
carrega o transbordo:

```ts
export type LinhaDoEnvioPorMes = {
  importId: string;
  nomeArquivo: string;
  origem: "csv_conta" | "csv_cartao";
  mes: string;
  lancamentos: number;
};

export type EnvioQueSai = {
  importId: string;
  nomeArquivo: string;
  /** "conta" ou "cartão" — o mesmo rótulo do histórico de `/upload`. */
  rotuloDeOrigem: string;
  /** Tudo que este envio leva, de todos os meses. */
  lancamentos: number;
};

export type MesAtingido = { mes: string; lancamentos: number };

export type OQueSaiDoMes = {
  /** Vazio quando o mês já não existe — a tela recusa em vez de confirmar. */
  envios: EnvioQueSai[];
  /** Quantos lançamentos saem **deste** mês. */
  noMes: number;
  /**
   * Os outros meses que perdem lançamentos junto.
   *
   * ⚠ Vazio é o caso comum, e é por isso que ele é uma lista e não um
   * `temTransbordo: boolean` ao lado — dois fatos sobre a mesma coisa são duas
   * chances de divergirem.
   */
  transbordo: MesAtingido[];
  /** Tudo que desaparece: este mês mais o transbordo. */
  total: number;
};

export function oQueSaiDoMes(
  mes: string,
  linhas: LinhaDoEnvioPorMes[],
): OQueSaiDoMes;
```

E, no mesmo módulo, a frase de **um** mês de transbordo:

```ts
export function fraseDoTransbordo(atingido: MesAtingido): string;
// → "junho de 2026 perde 4 lançamentos"  /  "…perde 1 lançamento"
```

⚠ **Uma frase por mês, e não uma frase da lista inteira.** Concatenar N meses
numa string é onde a gramática quebra sem ninguém notar ("1 lançamentos", vírgula
sobrando com um item só). Assim o plural fica sob teste e a junção fica no JSX,
que é onde ela é barata. O precedente é o `somaDasMetas` da spec 13: a frase que
carrega a decisão vem pronta e testada; a montagem da tela, não.

**Ordem determinística**, porque a tela lista os dois: envios por origem
(`csv_conta` antes de `csv_cartao`, a ordem dos campos do formulário) e depois
por nome de arquivo; transbordo por mês, crescente.

### `src/features/painel/remover-o-mes/oQueSaiDoMes.test.ts`

| Teste                                                                    | O que ele segura                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| dois envios só neste mês → sem transbordo, `total === noMes`               | o caso comum, e que a lista vazia é vazia mesmo              |
| um envio de conta com linhas no mês seguinte → transbordo com mês e número | ⚠ a Descoberta 3, que é a razão de tudo isto existir         |
| um envio que atravessa **dois** meses                                     | a lista de transbordo é lista, não um campo só               |
| dois envios, e só um transborda                                            | o transbordo é do conjunto, não de cada envio                |
| `lancamentos` de um envio soma **todos** os meses dele                     | é o número que some, não o que some deste mês                |
| mês sem envio nenhum → tudo zerado, `envios` vazio                         | a corrida: o mês saiu noutra aba enquanto esta estava aberta |
| `fraseDoTransbordo` com 1 e com 4                                          | "1 lançamento" e "4 lançamentos"                            |

## Arquivos a modificar

### `src/features/upload/enviar-extrato/exibirEnvio.ts` `INFRA`

Uma linha: o `ROTULO_DE_ORIGEM`, hoje privado do módulo, vira uma função
exportada `rotuloDeOrigem(origem)`, e o `paraEnvioExibido` passa a usá-la.

⚠ **Escrever "conta"/"cartão" de novo em `remover-o-mes/` seria a segunda
tradução da mesma coluna.** No dia em que uma delas mudar, duas telas passam a
chamar a mesma coisa por nomes diferentes — e nenhuma delas está errada, o que é
o pior tipo de divergência para achar.

---

## `src/features/painel/remover-o-mes/enviosDoMes.service.ts` `BACK`

`server-only`. Uma consulta, com subconsulta:

```
select  t.import_id, i.nome_arquivo, i.origem, t.mes_referencia, count(*)
from    transactions t
join    imports i on i.id = t.import_id
where   t.user_id = $userId
  and   t.import_id in (
          select import_id from transactions
          where user_id = $userId and mes_referencia = $mes
        )
group by t.import_id, i.nome_arquivo, i.origem, t.mes_referencia
```

Três coisas para notar:

1. ⚠ **Sem filtro de `status`** — a decisão do topo deste plano.
2. ⚠ **`user_id` nos dois `where`.** O de dentro escolhe os envios; o de fora
   protege o `join`. Parece redundante e não é: se um dia a subconsulta mudar de
   forma, é o `where` de fora que continua impedindo que um `import_id` de outra
   pessoa entre na contagem.
3. **`import_id` é `not null`** no schema, com índice próprio
   (`transactions_import_id_idx`). Não há linha órfã para tratar, e não precisa
   de guarda — está escrito aqui para ninguém acrescentar uma.

Devolve `LinhaDoEnvioPorMes[]`, cru. ⚠ **Não chama a B1**: quem junta consulta e
regra é a action da fase C. Um service que já devolve o objeto da tela é um
service que não dá para testar sem banco — e a B1 inteira existe para ser
testável.

**Não é chamado por ninguém** ao fim desta fase.

---

## Caminho feliz, bordas e erros

**Feliz:** mês com dois envios (conta e cartão), nenhum atravessando a virada.
`noMes === total`, `transbordo` vazio.

**Bordas:**

- **Extrato de conta que cruza a virada** — o caso que a Descoberta 3 mediu.
  Transbordo com o mês seguinte e a contagem dele.
- **Um mês formado por um envio só** — comum em quem manda o cartão separado.
- **Mês que já não existe** — devolve vazio, e a fase D transforma isso em
  recusa, não em confirmação de nada.
- **Envio com linhas `excluido`** — contam, e é o ponto do plano.
- **Mês com muitos envios** (reenvios ao longo do tempo) — a lista cresce; a
  ordem determinística mantém a tela estável entre dois carregamentos.

**Erros:** nenhum novo. A B1 é total. A B2 pode falhar como qualquer consulta —
quem trata é a action da C2, com a frase única de recusa que o
`desfazerImportacao` já estabeleceu.

---

## Verificação

1. `npx vitest run` — a suíte, com os sete casos novos.
2. `npx tsc --noEmit` — pega quem mais importava `ROTULO_DE_ORIGEM`.
3. `npx eslint .`, `npm run format:check`, `npx next build`.
4. ⚠ **Nada a conferir na tela**, e é o objetivo: se a fase B estiver certa, o
   app está idêntico ao de agora.
