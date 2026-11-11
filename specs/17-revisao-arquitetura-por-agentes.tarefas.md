# Tarefas — Revisão de Arquitetura por Agentes

Referência: `specs/17-revisao-arquitetura-por-agentes.md`.

> Não há camada front-end/back-end/banco aqui — o entregável é um único
> arquivo de skill (`~/.claude/skills/dev-senior-review/SKILL.md`, global —
> não vive dentro deste projeto, pra poder ser usado em qualquer repositório
> novo), que é instrução para o orquestrador, não código de aplicação. A
> ordem abaixo segue a mesma lógica do "visual antes de integração":
> primeiro o **esqueleto do fluxo** (sem workers de verdade), só depois a
> parte que dispara e consolida os workers — assim cada tarefa fica pequena
> e testável isoladamente.

## A1 — Esqueleto do comando: pergunta de budget + escopo ✅

## A2 — Varredura e seleção dos arquivos críticos ✅
## A3 — Disparo dos 4 workers isolados ✅
## A4 — Consolidação em `REVISAO_ARQUITETURA.md` ✅

_(A1–A4 implementadas em `~/.claude/skills/dev-senior-review/SKILL.md`,
Passos 1–7. Detalhe de cada uma nos planos correspondentes em
`specs/plans/`.)_

## A5 — Teste de ponta a ponta nas 3 faixas de budget ✅ (parcial)

Aritmética das 3 faixas confirmada (80→3×4, 60→2×4, 10→aborta). O caminho
de abort (`< 25%`) foi **executado de verdade**: não criou
`REVISAO_ARQUITETURA.md`.

⚠ **Pendência conhecida:** os Passos 4–7 (varredura real com `Glob`,
seleção de criticidade, disparo dos 4 workers via `Agent` tool,
consolidação no relatório) nunca foram exercitados de ponta a ponta — só
escritos e revisados por leitura. A primeira vez que o Davi rodar
`/dev-senior-review` com budget ≥ 25% é, na prática, o primeiro teste real
desse trecho. Vale observar o resultado com atenção nessa primeira
execução.

---

## A1 — Esqueleto do comando: pergunta de budget + escopo

**Camada:** comando (arquivo único)

Criar `.claude/commands/dev-senior-review.md` com: a pergunta obrigatória de
% de budget no início, a tabela de escopo (≥75%→3×4, 50-74%→2×4, 25-49%→1×4,
<25%→aborta) e o aviso de abort quando < 25%. Ainda **sem** varredura de
arquivos nem workers — só o fluxo de entrada e a decisão de quantos
arquivos/checagens vão rodar.

**Critério de pronto:** rodar `/dev-senior-review`, responder a uma %, e ver
o comando anunciar corretamente "vou revisar N arquivo(s) com M checagem(ns)
cada" (ou abortar, se < 25%) — sem ainda escolher arquivos reais nem escrever
relatório.

## A2 — Varredura e seleção dos arquivos críticos

**Camada:** comando (arquivo único)

Acrescentar ao comando: varredura de `src/**/*.{ts,tsx}` excluindo
`src/db/migrations/`, e o critério de criticidade da spec (hub de imports,
dado sensível/dinheiro, citado como "regra sem exceção" no
`architecture.md`, tamanho/complexidade) para ranquear e escolher os N
arquivos definidos na A1.

**Critério de pronto:** rodar o comando contra este projeto e ver uma lista
de N arquivos escolhidos com justificativa de 1 linha cada, coerente com o
critério — sem ainda disparar workers.

## A3 — Disparo dos 4 workers isolados

**Camada:** comando (arquivo único)

Acrescentar as 4 checagens (acoplamento/separação, tipagem/segurança,
Thin Client/Fat Server, duplicação/reuso) como sub-agentes isolados via
`Agent` tool, um por combinação arquivo × checagem, cada um recebendo o
arquivo, seu conteúdo e o trecho relevante do `architecture.md`.

**Critério de pronto:** rodar o comando com budget alto (≥75%) num arquivo
real do projeto e confirmar que saem 4 achados distintos e focados (não um
review genérico repetido 4 vezes).

## A4 — Consolidação em `REVISAO_ARQUITETURA.md`

**Camada:** comando (arquivo único)

Acrescentar a etapa final: juntar as respostas dos workers no formato da
spec (cabeçalho com data/budget/escopo, lista de arquivos e motivo, uma
seção por arquivo com as 4 subseções, resumo final com achados mais
graves primeiro) e sobrescrever `REVISAO_ARQUITETURA.md` na raiz.

**Critério de pronto:** rodar o comando de ponta a ponta e abrir
`REVISAO_ARQUITETURA.md` — estrutura bate com o formato da spec, e rodar de
novo sobrescreve em vez de duplicar.

## A5 — Teste de ponta a ponta nas 3 faixas de budget

**Camada:** validação

Rodar `/dev-senior-review` três vezes neste projeto variando a resposta de
budget (uma ≥75%, uma entre 50-74%, uma <25%) e confirmar que o escopo
executado (nº de arquivos/checagens) muda conforme a tabela, e que a faixa
<25% aborta sem gerar relatório nem gastar chamada de worker.

**Critério de pronto:** as 3 execuções batem com a tabela de escopo da
spec, e o abort da faixa <25% não sobrescreve um `REVISAO_ARQUITETURA.md`
anterior válido.
