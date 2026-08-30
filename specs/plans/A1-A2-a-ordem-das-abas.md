# Plano — A1 e A2, a ordem das abas

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** A1 (a regra de qual mês abre, fora do service) e A2 (ligar)
**Spec:** `specs/14-remover-um-mes.md`, Descobertas 1 e 2

⚠ **Esta é a metade pequena do pedido, e sai num commit só.** Ela conserta um
defeito que já existe; misturá-la com "remover um mês" faria o `git log` mentir
sobre o que aconteceu.

---

## A decisão que molda o plano: a função não confia na ordem que recebe

O rascunho óbvio é uma função que recebe a lista **já ordenada** pela consulta e
só inverte:

```ts
// ✗ o rascunho que repete o defeito
function mesesEPadrao(doMaisNovoAoMaisVelho: MesContado[]) {
  const padrao = doMaisNovoAoMaisVelho.find((m) => m.comMovimento > 0);
  return { meses: doMaisNovoAoMaisVelho.map((m) => m.mes).reverse(), padrao };
}
```

Ela funciona, e **recria o defeito que estamos consertando**. O bug da
Descoberta 1 é exatamente isto: um consumidor que documenta a ordem que espera e
um produtor que manda outra, com nada no meio conferindo. Uma função cujo
parâmetro se chama `doMaisNovoAoMaisVelho` é a mesma promessa não verificada,
mudada de arquivo.

**Então ela ordena por dentro.** `YYYY-MM` ordena lexicograficamente na mesma
ordem em que ordena cronologicamente — é por isso que este projeto guarda mês
como string desde a spec 02, e aqui a decisão finalmente paga.

Consequência, e é o ponto do plano:

⚠ **O `orderBy` da consulta deixa de ser necessário, e por isso ele sai.** Um
`orderBy(desc(...))` que parece sustentar a correção mas não sustenta é
precisamente a armadilha que criou este bug — o próximo a ler acharia que a
ordem se decide na consulta, e mexeria lá. Depois desta tarefa, **um lugar só
decide a ordem**, e ele tem teste.

---

## Arquivos a criar

### `src/features/painel/navegar-entre-meses/mesesEPadrao.ts` `INFRA`

Pura, sem `server-only`: não toca em banco, não tem segredo, e a pasta é a do
comportamento que ela serve — a mesma do `AbasDoPainel`, que é quem consome a
lista.

```ts
export type MesContado = {
  mes: string;
  /** Lançamentos que entram na conta — os `excluido` não contam. */
  comMovimento: number;
};

export type MesesDoPainel = {
  /** Do mais antigo ao mais novo: a ordem em que a fileira de abas é lida. */
  meses: string[];
  /** O que abre sozinho — o mês mais recente com movimento. */
  padrao: string;
};

export function mesesEPadrao(contados: MesContado[]): MesesDoPainel | null;
```

Corpo, em três passos:

1. lista vazia devolve `null` — **a conta sem nenhum mês**, que hoje é o
   `if (porMes.length === 0) return null` do service. Ele vem para cá porque é
   regra, e regra dentro do service é regra sem teste;
2. ordena crescente por `mes`;
3. o padrão é o **último** com `comMovimento > 0`; sem nenhum, o último de todos.

O docblock precisa carregar as duas metades da Descoberta 2, porque elas puxam
para lados opostos e é isso que torna a função necessária:

- a **fileira** é lida da esquerda para a direita em ordem de tempo;
- o **padrão** é o mais recente com movimento, e a razão é de campo: uma conta
  real tinha um mês com um único lançamento, e ele era um pagamento de fatura,
  já excluído do cálculo. O painel abria ali e mostrava uma tela zerada, com o
  mês anterior cheio (spec 04, D6).

### `src/features/painel/navegar-entre-meses/mesesEPadrao.test.ts`

Cinco casos, e cada um é uma frase da spec:

| Teste                                                              | O que ele segura                                                |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| a saída sai crescente **mesmo recebendo a lista embaralhada**        | ⚠ o coração do plano: a função não depende do `orderBy` de ninguém |
| o padrão é o mais recente **com movimento**, havendo um mais novo sem | a regra de campo da spec 04, que o `asc` ingênuo quebraria         |
| nenhum mês com movimento → o mais recente de todos                   | o `?? porMes[0]` de hoje, preservado                              |
| um mês só → fileira de um, e ele é o padrão                          | a conta que acabou de importar o primeiro extrato                 |
| lista vazia → `null`                                                 | a conta que ainda não importou nada                              |

⚠ **O primeiro teste é o que impede o defeito de voltar**, e ele só é possível
porque a função ordena por dentro. Com a assinatura do rascunho recusado, esse
teste não existiria — não há como testar uma promessa que o parâmetro faz.

E um a mais, que não é caso de entrada e sim de contrato:

- **o padrão está dentro de `meses`.** É o que a `dadosDoPainel` assume três
  linhas adiante, quando faz `meses.includes(mesPedido)` e cai no padrão. Se um
  dia o padrão saísse de fora da lista, o painel abriria num mês sem aba.

---

## Arquivos a modificar

### `src/features/painel/painel-do-mes/painelDoMes.service.ts` `BACK`

Três mudanças, todas no mesmo trecho (linhas ~63 a ~90):

1. **Sai o `.orderBy(desc(transactions.mesReferencia))`** da consulta de meses,
   com um comentário curto dizendo onde a ordem se decide agora. ⚠ O `desc` é
   usado **só ali** neste arquivo — o import da linha 2 perde ele, e o `asc`
   fica (linhas 123, 155 e 175).
2. **Saem as quatro linhas** que hoje calculam `meses`, `padrao` e o
   `if (porMes.length === 0) return null`, e entra:

   ```ts
   const navegacao = mesesEPadrao(porMes);
   if (navegacao === null) return null;

   const { meses, padrao } = navegacao;
   ```

3. **Fica tudo o mais como está** — inclusive o `const mes = mesPedido &&
   meses.includes(mesPedido) ? mesPedido : padrao`, que continua correto porque
   `meses` só mudou de ordem, não de conteúdo.

⚠ **Os dois comentários grandes que hoje vivem nessas linhas vão junto com a
regra.** O do `comMovimento` (por que só os que entram na conta são contados) e
o do seletor mostrar todos os meses são explicações de **decisão**, e decisão
mora onde a regra passou a morar. Deixá-los para trás faria o service explicar
uma linha que não está mais lá.

---

## O que não muda, e é importante que não mude

| O quê                       | Por quê                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `AbasDoPainel.tsx`          | ⚠ Ela **já estava certa**. O contrato dela (`do mais antigo ao mais novo`) é o que passa a ser verdade   |
| `TelaDoPainel` / `TelaDoComparativo` | Recebem `meses` e repassam. A ordem chega pronta                                                |
| `comparativo/page.tsx`      | Usa `dados.mes` (o mês escolhido), não a posição na lista                                               |
| `upload/page.tsx`           | Seu `meses[0]` vem de `mesesDisponiveis()`, que é um **calendário gerado**, não esta consulta. Intocado |
| A consulta em si            | Mesmas colunas, mesmo `where`, mesmo `group by`. Só a cláusula de ordenação sai                          |

⚠ **O `upload/page.tsx` foi conferido de propósito.** `meses[0]` como mês padrão
de um formulário é exatamente o tipo de linha que quebraria com uma inversão —
e ele não quebra, porque bebe de outra fonte. Está escrito aqui para ninguém
precisar conferir de novo.

---

## Caminho feliz, bordas e erros

**Feliz:** conta com vários meses. A fileira lê dezembro → julho da esquerda
para a direita; o painel abre em julho, como antes.

**Bordas:**

- **Um mês só** — a fileira tem uma aba, a do comparativo some (`meses.length <
  2`, já implementado), e o padrão é ele.
- **Mês novo sem movimento** (só pagamento de fatura) — ele aparece na fileira,
  na ponta direita, e **não** é quem abre. É o caso de campo da spec 04.
- **Nenhum mês com movimento** — abre no mais recente de todos, e a tela mostra
  o vazio que ela já sabe mostrar.
- **Nenhum mês** — `null`, e a rota já trata (é o estado "nada importado ainda").
- **`?mes=` de um mês que não existe** — `meses.includes` recusa e cai no padrão.
  Comportamento de hoje, preservado.

**Erros:** nenhum novo. A função é total: toda entrada tem saída, e a única
saída "ruim" (`null`) é um estado legítimo da conta, não uma falha.

---

## Verificação

1. `npx vitest run` — a suíte inteira, com os seis testes novos.
2. `npx tsc --noEmit` — pega o import de `desc` que sobraria.
3. `npx eslint .` e `npm run format:check`.
4. `npx next build`.
5. ⚠ **A conferência que só o Davi faz:** abrir a `/dashboard` e ver se a
   fileira lê da esquerda para a direita **e** se o painel abriu no mesmo mês de
   antes. As duas juntas — é o par que a Descoberta 2 diz que anda em direções
   opostas, e nenhum teste alcança a tela.
