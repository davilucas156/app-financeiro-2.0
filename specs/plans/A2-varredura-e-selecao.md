## Plano — A2: Varredura e seleção dos arquivos críticos

Referência: `specs/17-revisao-arquitetura-por-agentes.md`,
`specs/17-revisao-arquitetura-por-agentes.tarefas.md` (A2).

### Arquivos a modificar

- `.claude/commands/dev-senior-review.md` — substituir o antigo "Passo 4
  (ainda não implementado)" por dois passos novos:
  - **Passo 4 — Varrer os candidatos:** usar a ferramenta `Glob` com o
    padrão `src/**/*.{ts,tsx}`, descartando qualquer caminho dentro de
    `src/db/migrations/`.
  - **Passo 5 — Escolher os N arquivos:** aplicar o critério de
    criticidade da spec 17 (hub de imports; toca dado sensível/dinheiro;
    citado como "regra sem exceção" em `references/architecture.md`;
    tamanho/complexidade aparente) pra ranquear os candidatos e escolher os
    N definidos no tier do Passo 2 (A1). Anunciar a lista escolhida com 1
    linha de motivo cada.
  - Mover a nota "próximas etapas ainda não implementadas" pra depois
    desses dois passos novos, cobrindo só o que falta (disparo dos workers
    e relatório — A3/A4).

### Arquivos a criar

- Nenhum.

### Reuso identificado

- `references/architecture.md` já é lido/citado pelo comando (nenhuma
  leitura nova a cablear) — o Passo 5 só aponta pra ele como fonte do
  critério "regra sem exceção".
- Nenhuma ferramenta nova: `Glob`, já disponível por padrão, é suficiente
  pra varredura — não precisa de script auxiliar.

### Caminho feliz

- Davi já respondeu a % (A1) e o tier foi anunciado.
- Comando varre `src/**/*.{ts,tsx}`, exclui `src/db/migrations/`, obtém uma
  lista de candidatos (hoje, por exemplo, arquivos em `src/app`,
  `src/features`, `src/components`, `src/db` exceto migrations, `src/lib`).
- Comando aplica o critério de criticidade e escolhe os N do tier (ex.: 3,
  se `>= 75%`), anunciando cada um com o motivo (ex.: "`src/lib/db.ts` —
  citado como regra sem exceção no architecture.md e é hub de import de
  várias queries").

### Edge cases

- **Menos candidatos do que N** (ex.: tier pede 3, mas só existem 2
  arquivos `.ts`/`.tsx` fora de migrations): selecionar todos os
  disponíveis e avisar que o escopo real ficou menor que o planejado — não
  travar nem inventar arquivo.
- **Nenhum candidato** (`src/` vazio ou só com `.gitkeep`): avisar que não
  há nada pra revisar e parar, sem seguir pro disparo de workers (A3/A4).
- **Empate de criticidade entre dois arquivos** pro último lugar da lista:
  decidir por julgamento (ex.: o que toca dado mais sensível) e seguir —
  não é um caso que precise de regra determinística rígida, já que é
  heurística, não cálculo exato.
- **Candidato é um arquivo `.types.ts` puro** (sem lógica): pode compor a
  lista se, por critério, for mesmo o mais crítico disponível — a spec 17
  decidiu não excluir `.types.ts` por padrão (só `src/db/migrations/` é
  exclusão fixa).

### Erros

- `Glob` sem resultado nenhum é tratado como edge case acima, não como
  erro de sistema — não há chamada de rede ou banco nesta tarefa.

### Banco de dados

- Não aplicável a esta tarefa.
