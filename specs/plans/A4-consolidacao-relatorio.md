## Plano — A4: Consolidação em `REVISAO_ARQUITETURA.md`

Referência: `specs/17-revisao-arquitetura-por-agentes.md`,
`specs/17-revisao-arquitetura-por-agentes.tarefas.md` (A4).

> O Passo 7 já existe em `~/.claude/skills/dev-senior-review/SKILL.md`
> (mesmo motivo da A3: escrito junto na mudança pra skill global). Este
> plano documenta as decisões e acrescenta os edge cases que faltavam.

### Arquivos a modificar

- `~/.claude/skills/dev-senior-review/SKILL.md` — acrescentar ao Passo 7 os
  edge cases abaixo (todos voltados a nunca deixar o relatório mentir
  sobre o que foi de fato executado).

### Arquivos a criar

- Nenhum no skill. Em tempo de execução, o próprio comando cria/sobrescreve
  `REVISAO_ARQUITETURA.md` na raiz do projeto onde for rodado — esse
  arquivo não é parte da skill, é saída dela.

### Reuso identificado

- Formato do relatório é o já definido e aprovado na spec 17 — nenhuma
  mudança de estrutura aqui, só fechar os buracos de edge case.

### Caminho feliz

- Depois do Passo 6, o orquestrador junta os achados de cada worker nas
  seções correspondentes, escreve o cabeçalho (data, % de budget
  informado, escopo executado), a lista de arquivos com motivo, uma seção
  por arquivo com as 4 subseções, e termina com um resumo de 3–5 bullets
  (achados mais graves primeiro).
- Sobrescreve `REVISAO_ARQUITETURA.md` na raiz do projeto atual — sem
  manter histórico (decisão já tomada na spec).
- Avisa no chat que terminou, resume os 2–3 achados mais importantes, e
  aponta o caminho do arquivo gerado.

### Edge cases

- **Todos os workers voltam "sem achados"** (projeto limpo nessa rodada):
  o relatório ainda é gerado por completo — o resumo final diz algo como
  "nenhum problema estrutural crítico encontrado nesta rodada" em vez de
  inventar prioridade de ação pra preencher a seção.
- **Alguma checagem falhou (A3)**: a seção correspondente mostra "não foi
  possível avaliar esta checagem nesta rodada" em vez de omitir a
  subseção silenciosamente — o Davi precisa ver que algo não rodou, não
  assumir que rodou limpo.
- **`REVISAO_ARQUITETURA.md` já existe e tem conteúdo de uma rodada
  anterior**: sobrescreve de qualquer forma — já é a decisão tomada na
  spec (sem histórico), então não há merge nem backup automático.
- **Escopo real executado for menor que o planejado** (por causa de um
  edge case do Passo 5, ex.: menos candidatos do que N): o cabeçalho do
  relatório reflete o escopo **real** executado, não o que foi anunciado
  no Passo 3 — essas duas informações podem divergir e o relatório precisa
  contar a verdade.

### Erros

- Escrita do arquivo na raiz do projeto pode falhar por permissão —
  comportamento padrão (avisar e não fingir que terminou) é suficiente;
  não há necessidade de retry automático numa operação de escrita local
  de um `.md`.

### Banco de dados

- Não aplicável a esta tarefa.
