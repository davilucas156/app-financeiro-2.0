# Plano — C2 · Pote de renda

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** C2 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** BANCO
**Arquivos:** `schema.ts` + migration, `potes-padrao.ts`, `seed.ts`,
`globals.css`, `semente.ts`, `categorias.ts`, `ConcluirOnboarding.tsx`

## Por que isto existe

Os 8 potes repartem o que você **gasta**. Entrada não cai em pote de gasto —
ela forma o total do mês, que é a base dos percentuais.

Mas `categories.bucket_id` é `not null`: uma categoria de renda precisa de um
pote para pendurar. E `percentual_meta` nulo não serve para escondê-la —
Manutenção e Outros já são nulos e aparecem na tela.

Sobra dar um **tipo** ao pote.

## `tipo` com default `'gasto'`

A migration precisa preencher as 8 linhas que já existem, e todas as 8 são de
gasto. O default resolve isso e continua sendo a resposta certa depois: um pote
é de gasto até alguém dizer o contrário.

## O pote de renda e suas três categorias

Da pendência 2 da spec: **salário**, **renda extra**, **repasse recebido**.

| | |
|---|---|
| slug | `renda` |
| percentual | `null` — não entra no rateio, porque **é** o rateio |
| meta | `null` |
| observação | "o que entra" |
| ordem | 9 |

A chave `renda/renda-extra` é a que a A5 já semeia para o Pix recebido do
Cadillac. Ela nasce destravada, e a lista `AGUARDANDO_C2` da semente esvazia —
o teste que exige que ela seja exatamente o conjunto que falta vai quebrar se eu
esquecer, que era o objetivo dele.

## Uma cor nova, e ela é invenção minha

Os 8 potes têm cor vinda do `planejamento_anual_davi.html`. O pote de renda não
existe lá, então a cor dele **não tem origem** — é escolha minha, e digo isso
em vez de fingir que herdei.

Roxo `#a78bfa`, que já é token do design system (`--color-purple`) e é a única
cor livre: verde é Liberdade Financeira, ciano é Transporte, dourado é Metas.
Verde seria o natural para dinheiro entrando e é justamente o que está ocupado.

## Quais telas filtram por `gasto` — e quais **não**

Aqui mora a decisão de verdade desta tarefa.

| Tela | Filtra? | Por quê |
|---|---|---|
| `/bem-vindo`, "seus potes" | **Sim** | É a tela das metas e do rateio. Renda ali viraria um nono pote com "sem meta" e confundiria a explicação inteira |
| Painel: potes com barra | **Sim** (quando existir) | Mesma razão |
| `/revisao`, escolher categoria | **Não** | Um Pix recebido precisa de destino. Esconder renda aqui tornaria entrada impossível de classificar à mão |

O terceiro é o que quase passou batido. "As telas de pote filtram gasto" é
verdade para as telas **de pote**; a lista de escolher categoria não é uma
delas, e tratá-la como tal deixaria toda entrada sem saída.

## E a lista de escolher passa a olhar a direção

Se o lançamento é **entrada**, o pote de renda vem primeiro. Se é saída, vem por
último.

Custa cinco linhas e resolve o problema prático: numa lista de 9 potes e 25
categorias, quem acabou de receber um Pix não devia rolar até o fim para achar
"Renda extra".

Não é regra de negócio — é ordem de exibição, e a fase B existe justamente para
acertar isso antes de ligar os fios.

## O backfill da conta que já existe

O onboarding do Davi já rodou. A conta dele tem 8 potes e não vai ganhar o nono
sozinha.

Não invento mecanismo novo: `concluirOnboarding` já é idempotente
(`on conflict do nothing`, e o mapa de potes vem de um `select` e não do
`returning`). Rodá-la de novo insere só o que falta.

Isso é uma operação de dados na conta dele, então: rodo, conto o que mudou, e
confiro. Contas novas nascem certas sem nada disso.

## Edge cases

| Situação | Tratamento |
|---|---|
| Conta que já concluiu o onboarding | Backfill pela função idempotente que já existe |
| Rodar o backfill duas vezes | Não duplica — é o que `on conflict do nothing` garante |
| `tipo` inválido | `check` no banco |
| Pote de renda numa tela de meta | Filtrado por `tipo = 'gasto'` |
| Entrada sem categoria de renda escolhida | Continua caindo na revisão, como antes |

## Fora do escopo

- Somar a renda e calcular a base dos potes → spec do painel
- Editar categorias de renda → fase 2
- A regra da entrada da transferência para si mesmo → continua sem semear:
  ninguém acerta de fora se é passagem ou salário (A5)

## Critério de pronto (da Etapa 2)

- [ ] `buckets` ganha `tipo` (`gasto` / `renda`)
- [ ] Pote de renda no seed, com salário, renda extra e repasse recebido
- [ ] As telas de pote filtram `tipo = 'gasto'`
- [ ] `AGUARDANDO_C2` esvazia e a regra do Cadillac passa a ter destino
