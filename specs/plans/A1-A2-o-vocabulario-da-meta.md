# Plano — A1 e A2, o vocabulário da meta

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** A1 (ler o campo e decidir o que ele quer dizer) e A2 (a frase da soma)
**Spec:** `specs/13-metas-por-pote.md`

⚠ **Nada aqui muda a tela.** As duas funções sobem escritas, testadas e **ainda
não chamadas por ninguém** — o mesmo desenho da fase A das specs 10 e 12.

---

## A decisão que molda o plano: três respostas, não duas

O rascunho óbvio é `validarPercentual(texto): number | null` — devolve o número,
ou `null` se não deu. **Isso perde exatamente a distinção que a spec 13 existe
para preservar.** `null` teria de significar duas coisas ao mesmo tempo:

- _"o campo estava vazio, o pote fica sem meta"_ — que é um **sucesso**;
- _"você digitou `abc`"_ — que é uma **recusa**.

E os dois chegariam ao serviço iguais, gravando "sem meta" quando o usuário
errou de tecla.

Então o retorno tem três formas, e o tipo obriga quem chama a tratar as três:

```ts
export type MetaLida =
  | { ok: true; percentual: number }
  | { ok: true; percentual: null }   // sem meta, de propósito
  | { ok: false; mensagem: string };
```

⚠ Na prática as duas primeiras colapsam em `{ ok: true; percentual: number |
null }`, que é o que o código declara — mas a distinção **precisa estar no
documento**, porque é ela que faz `""` e `"abc"` tomarem caminhos diferentes.

O precedente é o `validarCategoria` da spec 05: `{ ok: false; mensagem }` em vez
de correção silenciosa. E aqui a razão é mais forte — corrigir em silêncio o
percentual da meta é decidir pelo dono do dinheiro.

---

## Arquivos a criar

### `src/features/categorias/definir-meta/percentual.ts` `INFRA`

Puro. **Sem `server-only`** — de propósito: o editor no cliente valida para dar
resposta imediata, e o serviço valida porque é ele quem grava. `server-only`
aqui quebraria o build no primeiro `import` do componente, que é a armadilha que
a spec 10 já pagou uma vez.

```ts
export type MetaLida =
  | { ok: true; percentual: number | null }
  | { ok: false; mensagem: string };

/** O que o usuário digitou → o que vai para `buckets.percentual_meta`. */
export function lerPercentual(texto: string): MetaLida;

/** `buckets.percentual_meta` → o que o campo mostra para edição. */
export function paraOCampo(percentual: number | null): string;
```

Regras de `lerPercentual`, na ordem:

1. `texto.trim()`. **Vazio → `{ ok: true, percentual: null }`** — sem meta.
2. `/^\d+$/` obrigatório. Recusa `10,5`, `10.5`, `-5`, `+10`, `abc`, `<script>`,
   `1e2`, `０１` (dígitos de largura plena). ⚠ **Só dígitos ASCII**: `\d` sem a
   flag `u` já é ASCII, mas o teste registra a intenção para que ninguém
   "conserte" isso depois acrescentando `\p{Nd}`.
3. Comprimento máximo **3** antes de converter — corta string gigante antes de
   `Number`, sem depender de `Number` se comportar bem com 10 000 dígitos.
4. `Number(...)`, e recusa fora de **0–100**.
5. `{ ok: true, percentual: n }`.

⚠ **`"0"` chega ao passo 5 e vira zero.** É meta de zero — qualquer gasto
estoura — e não "sem meta". Fica assim porque a Descoberta 5 da spec diz que
são estados diferentes, e porque a spec 04 já tomou a mesma decisão para a
renda: _"'nunca informou' faz a tela pedir o número; 'informou zero' dá meta
zero"_.

As mensagens de recusa são **uma frase que diz o que fazer**, no tom das do
`validarCategoria`:

| Entrada | Mensagem |
| ------- | -------- |
| não-dígito (`10,5`, `abc`) | "Use só números inteiros, de 0 a 100." |
| fora da faixa (`101`, `999`) | "A meta vai de 0 a 100%." |

Duas mensagens, não uma por caso: quem digitou `10,5` e quem digitou `101`
erraram coisas diferentes e precisam de correções diferentes.

`paraOCampo(null)` devolve `""` — o campo vazio **é** a representação de sem
meta, e é o que faz o editor abrir mostrando a verdade.

### `src/features/categorias/definir-meta/percentual.test.ts`

Cobre, por nome:

- `""`, `"   "`, `"\n"` → sem meta, `ok: true`.
- `"0"` → **zero**, e um `expect` explícito de que **não** é `null`. ⚠ É o teste
  que a spec 13 mais precisa que exista.
- `"30"`, `"100"` → passam.
- `"101"`, `"999"`, `"-5"`, `"10,5"`, `"10.5"`, `"abc"`, `"<script>"`, `"1e2"`,
  `"０１"`, `"1".repeat(5000)` → recusa **com mensagem**, nunca `percentual: null`.
- Ida e volta: `paraOCampo(lerPercentual("30").percentual) === "30"`, e
  `paraOCampo(null) === ""`.

### `src/features/categorias/definir-meta/somaDasMetas.ts` `INFRA`

```ts
export type SomaDasMetas = {
  /** Só os potes de gasto **com** percentual. */
  soma: number;
  potesComMeta: number;
  frase: string;
};

export function somaDasMetas(
  potes: { tipo: "gasto" | "renda"; percentual: number | null }[],
): SomaDasMetas;
```

- Ignora `tipo === "renda"` e ignora `percentual === null`. ⚠ **Sem meta não é
  zero**, é ausência — somar como zero daria a mesma soma e a **contagem**
  errada, e é a contagem que sustenta a frase.
- **Nunca devolve erro.** Não tem como reprovar nada (Pendência 3). O tipo não
  tem variante de falha, e isso é intencional: assinatura que não pode falhar é
  a forma mais barata de garantir que ninguém transforme a linha numa trava.

As frases, por caso:

| Caso | Frase |
| ---- | ----- |
| nenhum pote com meta | "Nenhum pote tem meta — o painel não vai julgar nada." |
| soma < 100 | "Seus potes somam N% da renda — sobram M% sem destino." |
| soma = 100 | "Seus potes somam 100% da renda." |
| soma > 100 | "Seus potes somam N% da renda — juntos, pedem mais do que entra." |

⚠ **A frase do >100 não usa "erro", "inválido" nem "corrija".** Ela descreve a
consequência e para. É a mesma escolha da prévia do mapeamento na spec 11:
mostrar o que vai acontecer em vez de perguntar se a pessoa tem certeza.

### `src/features/categorias/definir-meta/somaDasMetas.test.ts`

- A semente: 30/25/15/15/10/5 + dois nulos + o pote de renda → **100**, 6 potes
  com meta, frase de 100.
- Tudo nulo → a frase do "nenhum pote".
- Um pote com 250 → a frase do "pedem mais do que entra".
- 30 + 20 → 50, e a frase nomeia os **50 que sobram**.
- ⚠ Um pote de **renda com percentual não nulo** (que o banco permite hoje, e a
  B2 vai passar a recusar) **não entra na soma** — a função se defende do dado
  que já existe, em vez de confiar que ninguém o criou.

---

## Arquivos a modificar

**Nenhum.** É o critério de pronto da fase A: `git status` mostra só arquivos
novos, e o app roda idêntico.

---

## Reuso identificado

| O que | Onde | Uso aqui |
| ----- | ---- | -------- |
| `validarCategoria` | `categorias/nomear-categoria/validar.ts` | O **padrão** do retorno `{ ok, mensagem }` e do "uma chamada, dois lados". Copiar a forma, não o código |
| `validarMapeamento` | `upload/formatos-do-usuario/formatoDoUsuario.ts` | O precedente de **recusar** em vez de corrigir em silêncio, e o motivo escrito lá: ler a coluna errada todo mês é pior que uma mensagem |
| `escolhaValida` | `aparencia/preferencia/preferenciaDoAparelho.ts` | ⚠ O contra-exemplo: lá, valor inválido **cai no padrão em silêncio** — e está certo, porque é preferência de aparelho. Aqui não serve: cair em silêncio num percentual é decidir pelo dono do dinheiro |
| `PoteNaGestao` | `categorias/gerir-categorias/categoriasNaTela.ts` | O `somaDasMetas` aceita **a forma estrutural** (`{tipo, percentual}`), não o tipo importado — assim ele serve à tela e ao teste sem arrastar dependência |

⚠ **`emCentavos` fica de fora, e a tabela registra isso de propósito.** Ele é o
parser mais parecido do projeto e é a régua errada: percentual não tem
separador, não tem decimal, não tem moeda. Quem for executar vai ver a
semelhança — este parágrafo existe para que não a siga.

---

## Caminho feliz

1. O usuário digita `20` no pote Transporte.
2. `lerPercentual("20")` → `{ ok: true, percentual: 20 }`.
3. (Fase B) o serviço grava 20 em `buckets.percentual_meta`.
4. (Já existe) `metaDoPote` calcula `renda × 20 ÷ 100` e o painel desenha a
   barra nova, **sem novo upload**.
5. `somaDasMetas` recalcula e a linha diz quanto os potes somam agora.

---

## Edge cases

| Caso | O que acontece |
| ---- | -------------- |
| Campo vazio | Sem meta. O pote sai do julgamento, como Manutenção hoje |
| `"0"` | Meta zero. Barra sempre cheia, tudo estoura — **e é o que foi pedido** |
| `"030"` | 30. Zero à esquerda passa: `/^\d+$/` aceita e `Number` resolve |
| `" 30 "` | 30. O `trim` vem antes de tudo |
| `"100"` | Passa. Um pote só com a renda inteira é uma escolha legítima |
| Pote de renda com percentual no banco | Ignorado pela soma; a B2 impede novos |
| Conta sem pote nenhum | `soma: 0`, frase do "nenhum pote" — sem divisão, sem `NaN` |

---

## Erros

**Só existe um erro possível nesta fase**: entrada que não é percentual. Ela
volta como `{ ok: false, mensagem }` e **nunca** como sem meta.

Não há erro de banco, de rede ou de sessão aqui — não há banco, rede nem sessão.
É a razão de esta fase ser a primeira: ela se prova inteira com Vitest, e o que
ela não consegue errar não precisa ser conferido de novo nas fases seguintes.

---

## Banco de dados

**Nada.** Nenhuma migration, nenhuma coluna, nenhum `select`. `percentual_meta`
já existe; `valor_meta_centavos` continua dormindo (Pendência 2).

---

## Como saber que a fase A ficou pronta

1. `npm test` verde, com os casos nomeados acima.
2. `npx tsc --noEmit` e `npm run lint` limpos.
3. `npm run format:check` limpo — a regra passou a ser verificável hoje.
4. ⚠ **O app roda idêntico.** Nenhum arquivo existente foi tocado; `git status`
   mostra só os quatro arquivos novos.
