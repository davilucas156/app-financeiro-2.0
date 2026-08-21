# Plano — C1 · Tabela `classification_rules`

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** C1 de `specs/03-motor-de-classificacao.tarefas.md` — a C5 adiada da
spec 01
**Camada:** BANCO
**Arquivos:** `src/db/schema.ts` + uma migration

## O que é

Onde moram as regras que o motor da fase A consome. Uma linha por regra, por
usuário.

## O `criterio` é `jsonb`, e o tipo vem da A1

Os três critérios do MVP têm campos diferentes: `descricao_contem` tem um
termo, `pessoa` tem nome e direção opcional, `valor_direcao` tem faixa e
sentido. Três colunas nulas para cada tipo seria uma tabela com dois terços de
buracos e nenhuma garantia.

A coluna carrega o tipo `Criterio` da A1, importado, não redeclarado. Uma
segunda definição divergiria da primeira e o motor deixaria de casar regra sem
ninguém entender por quê — o erro que a A1 já evita reusando
`normalizarDescricao`.

`tipo_regra` fica **também** em coluna própria, redundante com o json de
propósito: é por ela que o índice e o `check` funcionam, e é ela que a D9 usa
para agrupar na tela sem abrir cada json.

## Apagar categoria: `cascade`, e o motivo desconfortável

A tarefa exige que apagar a categoria não deixe regra órfã. Três saídas:

| | O que faz | Por que não |
|---|---|---|
| `set null` | Regra fica apontando para o nada | É exatamente o órfão que a tarefa proíbe |
| `restrict` | Impede apagar a categoria | **Quebraria apagar o usuário:** `users` já cascateia para `categories`, e um `restrict` imediato faria a exclusão da conta falhar |
| `cascade` | Some com as regras junto | Escolhida |

`cascade` tem um defeito real: apagar uma categoria apaga aprendizado em
silêncio, e silêncio é o que este projeto evita.

O banco garante que não sobra lixo; **quem deve o aviso é a tela**. Quando a
fase 2 permitir apagar categoria, ela tem de dizer "isto leva junto 4 regras"
antes de confirmar — do mesmo jeito que a B3 mostra quantos pendentes uma regra
nova pega. Fica escrito no schema para não virar surpresa.

## Uma `chave` única por usuário, e ela não é enfeite

Coluna de texto com a identidade normalizada do critério —
`descricao_contem:PAPELARIA DO ZE BETIM` — única por usuário.

Resolve duas coisas de uma vez:

- **A D7 precisa ser idempotente**, como o resto do onboarding. Rodar o seed
  duas vezes não pode dobrar as regras do Davi. A A5 já calcula exatamente
  essa chave em `idDe`.
- **A D5 não pode criar duplicata.** Responder "sempre" duas vezes para o mesmo
  trecho tem de dar uma regra, não duas.

Mesmo padrão de `imports.hash` e `transactions.impressao`: a unicidade que
torna repetir a operação inofensivo mora no banco, não na esperança.

**Consequência para a D9:** editar o texto de uma regra até colidir com outra
existente vai bater no único e falhar. É o comportamento certo — duas regras
com o mesmo critério e destinos diferentes seriam um empate que ninguém
consegue explicar — mas a tela deve traduzir isso para "já existe uma regra
procurando por esse texto", e não mostrar erro de banco.

## `prioridade` sem default

A A5 reservou a faixa: **20** para movimento, **30** para o comum, e **abaixo
de 20 livre para as correções do Davi** — correção de quem olhou o lançamento
ganha do que eu semeei de longe.

Um default no banco convidaria a esquecer disso. Sem default, quem insere
escolhe.

## `origem`: `seed` ou `correcao`

A D9 mostra na tela quais regras vieram prontas e quais nasceram de uma
correção sua. E ela responde "de onde saiu essa regra?" seis meses depois — a
mesma pergunta que a C3 responde para a classificação.

Regra de seed **pode ser apagada como qualquer outra**. Marcar a origem é
informação, não proteção.

## Colunas

| Coluna | Tipo | Por quê |
|---|---|---|
| `id` | uuid | |
| `user_id` | text → `users` cascade | Regra é por usuário, nunca global |
| `tipo_regra` | text + check | Índice e agrupamento sem abrir o json |
| `criterio` | jsonb `Criterio` | O tipo da A1, importado |
| `chave` | text, único com `user_id` | Idempotência da D7 e antiduplicata da D5 |
| `categoria_id` | uuid → `categories` cascade | Destino |
| `prioridade` | integer, sem default | Faixa reservada da A5 |
| `origem` | text + check (`seed`/`correcao`) | De onde a regra veio |
| `criado_em` | timestamptz | |
| `atualizado_em` | timestamptz | A D9 edita |

Índices: `user_id` (toda leitura filtra por ele) e `categoria_id` (a D9 conta
quantas regras apontam para cada categoria).

## Fora do escopo

- Gravar o seed → D7
- Ler as regras para classificar → D1
- Criar regra a partir de correção → D5
- A tela `/regras` → D9

## Critério de pronto (da Etapa 2)

- [ ] Tabela criada com `user_id`, `tipo_regra`, `criterio`, `categoria_id`,
      `prioridade`, `origem`, `criado_em`
- [ ] Índice por `user_id`
- [ ] Apagar categoria não deixa regra órfã
