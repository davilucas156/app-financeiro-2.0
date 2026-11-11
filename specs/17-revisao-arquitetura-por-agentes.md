# Spec — Revisão de Arquitetura por Agentes

## Comando: `/dev-senior-review`

**Propósito:** dar ao Davi uma revisão de arquitetura sob demanda — nunca
automática — que escolhe sozinha os pontos mais críticos do código em `src/`,
avalia cada um sob várias lentes em paralelo (orquestrador + workers isolados),
e consolida tudo num relatório único na raiz do projeto. Existe pra pegar
problema estrutural (acoplamento, tipo frouxo, duplicação, regra de negócio
vazando pro front) antes que ele vire hábito copiado em mais um arquivo.

> Nota: isto não é uma tela — é um comando. Por isso esta spec usa "comando"
> em vez de "página" e "fluxo" em vez de "componentes visuais", mas segue a
> mesma lógica do template: comportamento primeiro, sem ambiguidade.

> ⚠ **Revisão de 2026-10-09:** a entrada original era "% do budget de
> tokens da janela de 5h" (seção abaixo ainda descreve o motivo de ter
> existido). Foi abandonada porque nenhuma ferramenta disponível mede
> tokens reais contra uma janela de uso — a % seria precisão fingida. A
> entrada virou **número de arquivos a revisar**, que é o que de fato
> controla o custo (N arquivos × 4 checagens = 4N chamadas de worker),
> sem conversão nem tabela de corte. As seções "Fluxo" e "Tabela de
> escopo" abaixo já refletem essa versão.

### Onde mora

**Skill global** em `~/.claude/skills/dev-senior-review/SKILL.md` — fora de
qualquer projeto específico, pra poder ser usada em qualquer repositório
novo que o Davi abrir, não só neste. Invocada manualmente (`/dev-senior-review`
ou pedindo em texto) dentro de uma sessão do Claude Code. **Nunca** dispara
automaticamente (sem hook, sem gatilho em save/commit/push). O orquestrador é
o próprio Claude da sessão; os workers são sub-agentes isolados via `Agent`
tool (um por combinação arquivo × checagem).

> Nome em minúsculas-com-hífen por convenção (`/dev-senior-review`), já que
> o nome dado (`/Dev-Senior-review`) vira isso na prática.
>
> Como a skill é global, ela generaliza dois pontos que antes eram
> hardcoded pra este projeto: o padrão de arquivos varrido (ajusta ao stack
> do projeto aberto, não fixo em `.ts`/`.tsx`) e a busca pelo documento de
> arquitetura (procura nomes comuns — `references/architecture.md`,
> `ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md` — e segue sem ele se nenhum
> existir, em vez de assumir que todo projeto tem um).

### Fluxo (comportamentos do usuário)

| Ação do usuário | Resposta do sistema |
|---|---|
| Davi digita `/dev-senior-review` | Sistema pergunta: "Quantos arquivos você quer que eu revise? Cada arquivo custa 4 checagens (4 chamadas de worker)." com opções de referência (1, 3, 5, 10, "todos os candidatos") e aceita qualquer outro número |
| Davi responde com um número N (ou "todos") | Sistema varre `src/**/*.{ts,tsx}`, excluindo `src/db/migrations/`, e lista os arquivos encontrados |
| (automático) | Orquestrador rankeia os candidatos por critério de criticidade (ver abaixo) e escolhe os N (ou todos, se pedido) |
| (automático) | Orquestrador dispara, em paralelo, um worker isolado por arquivo × checagem (4 checagens por arquivo, sempre) |
| (automático) | Orquestrador consolida as respostas dos workers em `REVISAO_ARQUITETURA.md` na raiz, **sobrescrevendo** a versão anterior |
| (automático) | Sistema avisa que terminou, resume os 2–3 achados mais importantes no chat e aponta o arquivo gerado |
| N `<= 0` | Sistema trata como desistência: não roda nenhum worker, não escreve relatório |
| Davi pede "todos os candidatos" e o total é grande (> ~15) | Sistema avisa o custo real (nº de candidatos × 4 chamadas) e pede confirmação antes de disparar os workers |

Não há pausa para aprovar a escolha dos arquivos antes de disparar os
workers (fora do caso "todos os candidatos" com custo alto, acima) —
decisão já tomada: a transparência vem no relatório final, não numa pausa
no meio.

### Escopo: número de arquivos, sem tabela de conversão

O escopo é direto — **N arquivos × 4 checagens = 4N chamadas de worker.**
Não existe mais uma tabela de corte por faixa (a versão anterior usava %
de 20/50/80/100 mapeada pra 1/2/3 arquivos): o número que o Davi informa
já é o escopo, sem tradução no meio.

As opções de referência oferecidas na pergunta (pra quem não quer pensar
num número do zero):

| Opção | Arquivos | Chamadas de worker |
|---|---|---|
| Rápido | 1 | 4 |
| Padrão | 3 | 12 |
| Grande | 5 | 20 |
| Extra grande | 10 | 40 |
| Completo | todos os candidatos | 4 × nº de candidatos |

Qualquer outro número inteiro positivo também é aceito — as opções acima
são sugestão, não um menu fechado.

### Critério de criticidade (como o orquestrador escolhe os arquivos)

Sem rodar ferramenta externa — é julgamento do orquestrador ao olhar a lista
de arquivos e, quando necessário, espiar imports. Pesa a favor de um arquivo:

- É um hub: muitos outros arquivos o importam, ou ele importa muita coisa de
  módulos diferentes.
- Toca dado sensível ou dinheiro: schema do banco, server actions que
  calculam/gravam valores, autenticação, chamada à API da Anthropic.
- É citado em `references/architecture.md` como "regra sem exceção" (ex:
  `proxy.ts`, `garantirUsuario`, `db.ts`) ou como responsável por uma regra
  de segurança (filtro por `user_id`, Thin Client/Fat Server).
- Tamanho/complexidade aparente (arquivo grande, múltiplas responsabilidades
  no nome/caminho).

### As 4 checagens (um worker isolado por checagem, por arquivo)

Cada worker recebe: o caminho do arquivo, o conteúdo do arquivo, o trecho
relevante de `references/architecture.md` (pra ter a régua do projeto, não a
régua genérica), e **uma única pergunta focada**:

1. **Acoplamento e separação de conceitos** — o arquivo mistura regra de
   negócio com componente visual ou rota? Respeita o "Isolamento por
   comportamento" (cada comportamento na sua subpasta)?
2. **Tipagem e segurança de tipos** — uso de `any`, falta de interface/tipo,
   tratamento de erro ausente ou genérico demais.
3. **Thin Client / Fat Server** — alguma lógica sensível, chave/token, ou
   validação que *sozinha* garante segurança está vazando pro front-end?
4. **Duplicação e reuso** — o arquivo reinventa algo que já existe na lista
   "Componentes/módulos reutilizáveis já existentes" do `architecture.md`?

### Saída: `REVISAO_ARQUITETURA.md`

Sobrescrito a cada execução (sem histórico). Estrutura:

```
# Revisão de Arquitetura — <data>

Arquivos pedidos: <N> · Escopo executado: <N arquivos> × <M checagens>

## Arquivos revisados e por quê
- `caminho/arquivo.ts` — <motivo da escolha>
...

## `caminho/arquivo.ts`
### Acoplamento e separação de conceitos
<achado do worker>
### Tipagem e segurança de tipos
<achado do worker>
### Thin Client / Fat Server
<achado do worker>
### Duplicação e reuso
<achado do worker>

## Resumo e prioridade de ação
<3-5 bullets, achados mais graves primeiro>
```

### Dados envolvidos

- **Lê:** árvore de `src/**/*.{ts,tsx}` (exclui `src/db/migrations/`),
  conteúdo dos arquivos escolhidos, `references/architecture.md`.
- **Escreve:** `REVISAO_ARQUITETURA.md` na raiz do projeto (sobrescreve).
- Não lê nem escreve banco de dados, não chama API externa além do próprio
  Claude Code, não modifica nenhum arquivo em `src/`.

### Fora de escopo (por agora)

- Pausa para aprovar a escolha dos arquivos antes dos workers rodarem.
- Histórico de execuções anteriores (cada rodada sobrescreve a anterior).
- Qualquer gatilho automático (hook, CI, pre-commit).
- Medir o uso real de tokens — não há leitura em tempo real do consumo da
  janela de 5h (essa informação não é exposta por nenhuma ferramenta
  disponível nesta sessão). É justamente por isso que o controle de
  escopo é por **número de arquivos**, não por %: é um dial que o
  orquestrador de fato pode cumprir, em vez de uma meta que não pode
  verificar.
