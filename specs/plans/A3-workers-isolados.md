## Plano — A3: Disparo dos 4 workers isolados

Referência: `specs/17-revisao-arquitetura-por-agentes.md`,
`specs/17-revisao-arquitetura-por-agentes.tarefas.md` (A3).

> O Passo 6 já existe em `~/.claude/skills/dev-senior-review/SKILL.md`
> (escrito durante a mudança pra skill global, pra não reescrever o mesmo
> conteúdo duas vezes). Este plano documenta as decisões daquele passo e
> acrescenta os edge cases que faltavam antes de considerar a A3 fechada.

### Arquivos a modificar

- `~/.claude/skills/dev-senior-review/SKILL.md` — acrescentar ao Passo 6
  uma seção "Edge cases desta etapa" (hoje só existe no Passo 5), cobrindo:
  arquivo grande demais pra ler de uma vez, worker sem achado, falha de uma
  chamada de sub-agente, e arquivo que passou pelo glob mas não é texto.

### Arquivos a criar

- Nenhum.

### Reuso identificado

- `Agent` tool já é a ferramenta usada no resto do Claude Code pra
  sub-chamadas isoladas — não há necessidade de nenhum mecanismo próprio
  (fila, script, etc.) pra disparar os 4 workers.

### Caminho feliz

- Para cada um dos N arquivos escolhidos no Passo 5, dispare os 4 workers
  (ou menos, se o tier for `25–49`, que já limita a 1 arquivo × 4 — o
  número de *checagens* por arquivo é sempre 4 em todos os tiers; o que
  muda entre tiers é só o número de *arquivos*, nunca o número de
  checagens por arquivo, conforme a tabela do Passo 2).
- Cada worker recebe o caminho, o conteúdo do arquivo e o trecho relevante
  do documento de arquitetura (se existir), e devolve um achado focado
  numa única pergunta.

### Edge cases

- **Arquivo grande demais pra caber numa leitura só:** o worker lê em
  partes (ou foca na assinatura de funções/exports e nos trechos com mais
  lógica) e o achado menciona que a leitura foi parcial — não trava a
  revisão por isso.
- **Worker não encontra nada digno de nota:** reportar explicitamente "sem
  achados relevantes nesta checagem" em vez de forçar um problema pra
  preencher espaço. Isso é esperado e saudável — um arquivo limpo numa
  checagem não é um bug no processo.
- **Falha de uma chamada de sub-agente** (erro, resposta vazia): não travar
  as outras 3 (ou 11) chamadas. A seção correspondente no relatório final
  (A4) vira "não foi possível avaliar esta checagem nesta rodada", e o
  resumo final não conta essa seção como achado.
- **Arquivo que o glob trouxe mas não é texto/código de verdade** (ex.:
  binário por engano de extensão): pular esse arquivo específico, avisar, e
  seguir com os outros — não deveria acontecer com o filtro `.ts`/`.tsx`,
  mas é barato prevenir.

### Erros

- Cobertos nos edge cases acima (falha de sub-agente é o único "erro" de
  fato possível nesta etapa — não há banco nem rede além da própria
  chamada de agente).

### Banco de dados

- Não aplicável a esta tarefa.
