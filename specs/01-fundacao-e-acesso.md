# Spec — Fundação e Acesso (login, cadastro por convite, onboarding)

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Status:** ✅ aprovada pelo Davi
**Origem:** `readme.md` seções 3, 4, 10, 11 e pergunta 3 da seção 14
**Arquitetura:** `references/architecture.md`

## Escopo desta funcionalidade

Tudo que é necessário para um usuário sair de "nunca entrou no app" e chegar
em "está autenticado, tem os 6 potes criados e vê uma tela inicial vazia".

**Está dentro:**
- Projeto Next.js inicializado e rodando na Vercel
- Login e cadastro via Clerk (Google apenas)
- Restrição de cadastro a e-mails convidados
- Sincronização do usuário do Clerk para a tabela `users` do Postgres
- Proteção de rotas (ninguém não-autenticado acessa área interna)
- Onboarding: criação dos 6 potes padrão do usuário novo
- Seed das regras já validadas do Davi na conta dele
- Shell autenticado (cabeçalho + navegação + sair)

**Está fora (vira spec própria depois):** upload de CSV, motor de
classificação, tela de revisão, dashboard com dados reais, comparativo anual.

## Decisões já tomadas

| Decisão | Escolha | Consequência |
|---|---|---|
| UI de auth | Componentes prontos do Clerk (`<SignIn />`, `<SignUp />`) | Estilizados via `appearance`; não escrevemos formulário |
| Método de entrada | **Google apenas** | Sem senha, sem verificação de e-mail, sem "esqueci minha senha" |
| Acesso | **Convite fechado** (allowlist de e-mails) | Tela de cadastro precisa de estado "e-mail não convidado" |
| Potes | 6 fixos no MVP, já vinculados a `user_id` | Interface de edição fica pra fase 2 |

---

## Página: Raiz (`/`)

**Propósito:** decidir pra onde o usuário vai, sem ele precisar escolher.

### Componentes

| Componente | Estado inicial | Variações |
|---|---|---|
| Nenhum (rota de redirecionamento) | — | — |

### Comportamentos do usuário

| Ação do usuário | Resposta do sistema |
|---|---|
| Abre `/` sem sessão | Redireciona para `/entrar` |
| Abre `/` com sessão e onboarding concluído | Redireciona para `/dashboard` |
| Abre `/` com sessão e onboarding **não** concluído | Redireciona para `/bem-vindo` |

### Dados envolvidos

- **Lê:** sessão do Clerk (servidor); `users.onboarding_concluido_em`
- **Escreve:** nada

---

## Página: Entrar (`/entrar`)

**Propósito:** deixar um usuário já convidado voltar pro painel dele.

### Componentes

| Componente | Estado inicial | Variações |
|---|---|---|
| Marca do app (logo + nome + subtítulo curto) | Estático | — |
| `<SignIn />` do Clerk, com botão "Continuar com Google" | Botão pronto pra clique | **Carregando:** spinner do Clerk enquanto o widget monta e durante o redirect. **Erro:** mensagem do Clerk dentro do próprio card (ex: popup do Google fechado, rede caiu). **Bloqueado:** e-mail fora da allowlist |
| Link "Não tem conta? Solicitar acesso" | Estático | Aponta para `/cadastrar` |

### Comportamentos do usuário

| Ação do usuário | Resposta do sistema |
|---|---|
| Toca em "Continuar com Google" | Abre o fluxo OAuth do Google |
| Autentica com sucesso, conta já existe | Cria sessão e redireciona para `/dashboard` |
| Autentica com sucesso, mas é o **primeiro** acesso | Cria sessão, grava o usuário no banco e redireciona para `/bem-vindo` |
| Autentica com e-mail **fora da allowlist** | Não cria sessão. Mostra "Esse e-mail ainda não tem acesso ao app." + botão "Solicitar acesso" |
| Cancela/fecha o popup do Google | Volta para `/entrar` intacto, sem mensagem de erro agressiva |
| Já está logado e abre `/entrar` | Redireciona direto para `/dashboard` (não mostra login de novo) |
| Perde conexão no meio do fluxo | Mensagem "Não foi possível conectar. Tente de novo." e o botão volta a ficar clicável |

### Dados envolvidos

- **Lê:** allowlist de e-mails; sessão do Clerk
- **Escreve:** sessão do Clerk; `users` (apenas no primeiro acesso, via sincronização)

---

## Página: Cadastrar / Solicitar acesso (`/cadastrar`)

**Propósito:** deixar entrar quem foi convidado e explicar a situação de quem
não foi, sem parecer que o app quebrou.

### Componentes

| Componente | Estado inicial | Variações |
|---|---|---|
| `<SignUp />` do Clerk (Google) | Botão pronto pra clique | **Carregando**, **Erro**, **Recusado por allowlist** |
| Aviso "O acesso está fechado durante a validação" | Sempre visível | — |
| Bloco "Não convidado" | Oculto | Aparece quando a allowlist recusa: texto explicativo + `mailto:` pro Davi |
| Link "Já tem acesso? Entrar" | Estático | Aponta para `/entrar` |

### Comportamentos do usuário

| Ação do usuário | Resposta do sistema |
|---|---|
| Toca em "Continuar com Google" e o e-mail **está** na allowlist | Cria a conta, grava em `users` e redireciona para `/bem-vindo` |
| Toca em "Continuar com Google" e o e-mail **não está** na allowlist | Não cria conta nem sessão. Mostra o bloco "Não convidado" com o contato do Davi |
| Tenta cadastrar um e-mail que já tem conta | Clerk reconhece e trata como login: entra e vai para `/dashboard` |
| Cancela o popup do Google | Volta pra tela de cadastro intacta |

### Dados envolvidos

- **Lê:** allowlist de e-mails
- **Escreve:** usuário no Clerk; linha em `users`

---

## Página: Bem-vindo / Onboarding (`/bem-vindo`)

**Propósito:** o primeiro acesso não pode cair num dashboard vazio e mudo. Aqui
o usuário entende o modelo dos 6 potes e sai com a conta pronta pra receber o
primeiro extrato.

### Componentes

| Componente | Estado inicial | Variações |
|---|---|---|
| Saudação com o primeiro nome vindo do Google | Renderizado no servidor | **Sem nome no perfil:** cai para "Olá!" |
| Explicação curta do modelo dos 6 potes (2–3 frases) | Estático | — |
| Lista dos 6 potes que serão criados (emoji, nome, % meta) | Somente leitura no MVP | Edição fica pra fase 2 |
| Botão "Começar" | Habilitado | **Enviando:** desabilitado com spinner. **Erro:** mensagem + botão "Tentar de novo" |

### Comportamentos do usuário

| Ação do usuário | Resposta do sistema |
|---|---|
| Chega em `/bem-vindo` no primeiro acesso | Mostra a explicação e a lista dos potes padrão |
| Toca em "Começar" | Cria no banco os 6 potes e as categorias padrão do usuário, marca `onboarding_concluido_em` e redireciona para `/dashboard` |
| Toca em "Começar" e a gravação falha | Nada é gravado pela metade (tudo numa transação). Mostra "Não conseguimos preparar sua conta. Tente de novo." |
| Toca em "Começar" duas vezes (duplo toque / rede lenta) | Operação idempotente: a segunda chamada não duplica potes |
| Abre `/bem-vindo` já tendo concluído o onboarding | Redireciona para `/dashboard` |
| É a conta do **Davi** (e-mail dele) | Além dos 6 potes, o seed carrega também as `classification_rules` já validadas (Giulia, Cadillac, Uber, Vivo, Total Pass, etc.) |
| Fecha o app no meio do onboarding | Continua sem `onboarding_concluido_em`; no próximo acesso volta para `/bem-vindo` |

### Dados envolvidos

- **Lê:** perfil do Clerk (nome, e-mail); definição dos potes padrão
- **Escreve:** `buckets` (6 linhas), `categories` (padrão), `classification_rules`
  (só na conta do Davi), `users.onboarding_concluido_em`

---

## Página: Shell autenticado (layout de `/dashboard`, `/upload`, `/revisao`)

**Propósito:** moldura comum de toda a área interna. Não é uma tela, é o que
envolve todas elas.

### Componentes

| Componente | Estado inicial | Variações |
|---|---|---|
| Cabeçalho com nome do app e mês de referência | Mês atual | — |
| `<UserButton />` do Clerk (avatar → menu → Sair) | Avatar do Google | **Sem foto:** iniciais |
| Navegação inferior mobile (Painel / Enviar / Revisar) | Item ativo destacado | Alvos de toque ≥ 44px |
| Área de conteúdo | Slot da rota filha | — |

### Comportamentos do usuário

| Ação do usuário | Resposta do sistema |
|---|---|
| Toca num item da navegação | Navega pra rota, mantendo o cabeçalho |
| Toca em "Sair" | Encerra a sessão e volta para `/entrar` |
| Sessão expira e ele toca em qualquer coisa | Redireciona para `/entrar`; após reentrar, volta pra rota que ele tentou acessar |
| Digita na barra de endereço uma rota interna sem sessão | Middleware bloqueia antes de renderizar; vai para `/entrar` |

### Dados envolvidos

- **Lê:** sessão do Clerk; `users.nome`
- **Escreve:** nada

---

## Comportamentos sem tela (back-end)

Não têm interface, mas são parte desta funcionalidade e precisam de tarefa
própria na Etapa 2.

### Sincronizar usuário Clerk → Postgres

| Evento | Resposta do sistema |
|---|---|
| Clerk emite `user.created` | Insere linha em `users` (id do Clerk como chave, nome, e-mail) |
| Clerk emite `user.updated` | Atualiza nome/e-mail da linha correspondente |
| Clerk emite `user.deleted` | Marca o usuário como removido (não apaga os dados financeiros de imediato) |
| Webhook chega com assinatura inválida | Responde 401 e não grava nada |
| Webhook chega duplicado (retry do Clerk) | Idempotente: `insert ... on conflict do update`, sem linha duplicada |
| Usuário autentica mas o webhook ainda não chegou | O primeiro acesso à área interna garante a linha em `users` (não confiar só no webhook) |

### Proteção de rotas

| Situação | Resposta do sistema |
|---|---|
| Requisição sem sessão para rota interna | Middleware do Clerk redireciona para `/entrar` |
| Qualquer leitura/escrita no banco | Filtra por `user_id` obtido de `auth()` no servidor. **Nunca** por `user_id` vindo do client (`references/architecture.md`, Thin Client / Fat Server, item 3) |

## Dados — tabelas tocadas nesta funcionalidade

Detalhamento de tipos fica na Etapa 3 (Plan). Aqui só o que é tocado:

- `users` — id (Clerk), nome, email, criado_em, onboarding_concluido_em
- `buckets` — 6 linhas por usuário, criadas no onboarding
- `categories` — categorias padrão dentro dos potes
- `classification_rules` — só populada no onboarding da conta do Davi

## Pendências — todas resolvidas

1. ~~Os 6 potes exatos.~~ ✅ Extraídos do painel HTML e documentados em
   `references/design-system.md`. As metas em reais (360/300/180/180/120/60)
   sobre uma base de R$1.200 confirmam os percentuais 30/25/15/15/10/5% do
   `readme.md`. Além dos 6, o seed cria **Manutenção** e **Outros/Repasses**
   com `percentual_meta = null`.
2. ~~`planejamento_anual_davi.html` fora do repositório.~~ ✅ Adicionado pelo
   Davi; design system extraído para `references/design-system.md`.
3. ~~Allowlist inicial.~~ ✅ `davilucascarmo@gmail.com`.
