## Plano — A1: Esqueleto do comando (pergunta de budget + escopo)

Referência: `specs/17-revisao-arquitetura-por-agentes.md`,
`specs/17-revisao-arquitetura-por-agentes.tarefas.md` (A1).

### Arquivos a criar

- `.claude/commands/dev-senior-review.md` — definição do slash command
  `/dev-senior-review`. Frontmatter com `description` curta. Corpo com as
  instruções (em português, pra quem ler o arquivo mais tarde entender sem
  traduzir):
  1. Perguntar, antes de qualquer outra coisa: "Até qual % do seu budget de
     tokens da janela de 5h posso usar nesta revisão? (0-100)".
  2. Validar a resposta (ver Edge cases).
  3. Calcular o tier pela tabela da spec:
     - `>= 75` → 3 arquivos × 4 checagens (12 chamadas)
     - `50–74` → 2 arquivos × 4 checagens (8 chamadas)
     - `25–49` → 1 arquivo × 4 checagens (4 chamadas)
     - `< 25` → abortar
  4. Anunciar o tier calculado ao usuário (nº de arquivos e checagens).
  5. **Nota temporária desta tarefa (A1):** como a varredura/seleção (A2) e
     os workers (A3/A4) ainda não existem, o comando para aqui e avisa
     "próximas etapas (varredura e workers) ainda não implementadas". Essa
     nota e o "parar aqui" somem na A2, quando o fluxo passa a continuar de
     verdade.

### Arquivos a modificar

- Nenhum (primeira tarefa do comando; `.claude/commands/` ainda não existe
  neste projeto).

### Reuso identificado

- Nenhum componente de código — é só um arquivo de instrução (prompt) pro
  Claude Code, sem lógica de aplicação. A tabela de escopo e os limites de
  tier são os já definidos e aprovados na spec 17, não reinventados aqui.

### Caminho feliz

- Davi digita `/dev-senior-review`.
- Comando pergunta a %.
- Davi responde, por exemplo, `80`.
- Comando calcula tier `>= 75` → anuncia "vou revisar 3 arquivos com 4
  checagens cada (até 12 chamadas de worker)" e avisa que a varredura real
  ainda não está implementada (nota temporária da A1).

### Edge cases

- **Resposta não numérica** ("bastante", "não sei", "pode usar tudo"):
  comando pede de novo, oferecendo as 4 faixas como referência (ex: "pode
  responder algo como 80, ou dizer 'o máximo' pra 100").
- **Número fora de 0–100** (negativo, ou maior que 100): comando avisa que
  o valor é inválido e pede de novo.
- **Valores exatamente nos limites** (25, 50, 75, 100): pertencem ao tier de
  cima do corte, conforme a tabela (`25` cai em 25–49, não em abort; `50`
  cai em 50–74; `75` cai em `>= 75`). Já está assim na spec — só confirmar
  que a lógica implementada usa `>=`/`<` nos pontos certos.
- **Davi não responde / cancela a sessão no meio da pergunta:** comportamento
  padrão do Claude Code (a execução simplesmente não continua); nenhum
  tratamento especial necessário nesta tarefa.

### Erros

- Não há chamada de rede, banco ou arquivo nesta tarefa — só texto e
  aritmética simples, então não há cenário de erro de sistema a cobrir
  além da validação de entrada (já listada em Edge cases).

### Banco de dados

- Não aplicável a esta tarefa.
