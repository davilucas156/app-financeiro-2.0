# Plano — C3 · Registrar como cada lançamento foi classificado

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** C3 de `specs/03-motor-de-classificacao.tarefas.md` — fecha a fase C
**Camada:** BANCO
**Arquivos:** `src/db/schema.ts` + uma migration

## O que é

Guardar em `transactions` **como** a categoria chegou ali. A tarefa nasceu de
uma pergunta: "por que isso caiu em Lazer?", feita seis meses depois.

## A chave inteira do desenho: a resposta não pode morrer com a regra

A D9 — que o Davi pediu no portão — deixa apagar regra. Se a procedência for só
uma chave estrangeira para `classification_rules`, então no dia em que ele
apagar uma regra a resposta some para todos os lançamentos que ela classificou.

Ou seja, **a C3 falharia exatamente no cenário que a D9 cria.**

Por isso são duas colunas, com dois trabalhos diferentes:

| Coluna | Trabalho | Sobrevive a |
|---|---|---|
| `regra_id` (FK, `set null`) | "me mostre os 8 lançamentos desta regra" — a segunda ação explícita da D9 | edição da regra; morre no apagar |
| `regra_chave` (texto congelado) | "veio de uma regra que procurava por X" | tudo, inclusive apagar e editar |

`regra_id` sobrevive à edição porque o id não muda quando o texto muda.
`regra_chave` é congelada no instante da classificação, então ela conta o que
era verdade **naquele dia** — que é o que uma procedência tem de contar.

## `set null` na regra, nunca `cascade`

Precisa ser dito em voz alta porque o erro é fácil e catastrófico: com
`cascade`, apagar uma regra **apagaria os lançamentos** que ela classificou.

Uma regra some; o dinheiro que passou pela sua conta, não.

## Também guardo **qual** sugestão foi aceita

A tarefa pede três procedências: regra, sugestão aceita, escolha manual. Mas
"sugestão aceita" sozinha não diz de quem era a sugestão.

A A4 já produz quatro fontes, e a diferença entre elas é a diferença de
confiança: "você aceitou o que você mesmo já tinha classificado" e "você
aceitou um palpite do banco" são histórias diferentes quando algo deu errado.

Uma coluna nula a mais, e o tipo `FonteDeSugestao` já existe.

## Três `check` que impedem estado impossível

| Invariante | Por quê |
|---|---|
| `categoria_id` nulo ⟺ `classificado_por` nulo | Lançamento classificado tem de dizer como; não classificado não pode alegar procedência |
| `regra_chave` só existe se `classificado_por = 'regra'` | Senão a coluna vira lixo com aparência de informação |
| `fonte_da_sugestao` só existe se `classificado_por = 'sugestao'` | Idem |

Note que a primeira **não** cobre `regra_id`: depois de um `set null` ele fica
nulo enquanto `classificado_por` continua `'regra'`. Isso não é inconsistência,
é o registro de que a regra foi apagada — e é justamente por isso que
`regra_chave` existe.

## Colunas

| Coluna | Tipo |
|---|---|
| `classificado_por` | text · `regra` / `sugestao` / `manual`, nulo enquanto pendente |
| `regra_id` | uuid → `classification_rules`, `on delete set null` |
| `regra_chave` | text, congelada |
| `fonte_da_sugestao` | text · as quatro fontes da A4 |
| `classificado_em` | timestamptz |

Índice em `regra_id`, que é a consulta da D9.

`classificado_em` entra porque "quando" é parte de "por quê", e porque o
"Voltar" da D6 precisa saber a ordem em que as decisões foram tomadas.

## Nada quebra no que já existe

Todas as colunas são nulas. A importação da spec 02 continua gravando do mesmo
jeito, e os 33 lançamentos que já estão no banco continuam válidos: sem
categoria e sem procedência, que é a verdade sobre eles.

## Fora do escopo

- Preencher isso durante a importação → D1
- Preencher ao gravar a decisão → D4
- Mostrar a procedência na tela → D9
- Reclassificar o que uma regra pegou → D9, como segunda ação explícita

## Critério de pronto (da Etapa 2)

- [ ] `transactions` guarda a procedência (regra, sugestão aceita, escolha
      manual)
- [ ] Quando veio de regra, guarda **qual**
- [ ] A resposta sobrevive ao apagar da regra
