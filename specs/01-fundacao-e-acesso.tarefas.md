# Tarefas — Fundação e Acesso

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/01-fundacao-e-acesso.md` (aprovada)
**Status:** ✅ concluída — fases A a E entregues e em produção

Ordem obrigatória: **protótipo visual primeiro**, integração depois. As fases
C, D e E só começam depois que a fase B for aprovada visualmente pelo Davi.

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## Fase A — Fundação técnica (sem tela)

### A1 · Inicializar o projeto Next.js
**Camada:** INFRA
**Pronto quando:** `npm run dev` sobe o app numa página em branco; TypeScript,
Tailwind e ESLint configurados; a árvore de pastas de `references/architecture.md`
existe (`src/app`, `src/features`, `src/components/ui`, `src/db`, `src/lib`);
`.env.example` criado; `.gitignore` cobrindo `.env*`.

### A2 · Design tokens
**Camada:** INFRA
**Pronto quando:** `Syne` e `DM Mono` carregadas via `next/font/google`; todas
as cores de `references/design-system.md` disponíveis como CSS variables e como
cores do Tailwind; fundo `--bg` e texto `--text` aplicados no `<body>`; uma
página de teste mostra as 8 cores de pote corretas.

### A3 · Componentes base de UI
**Camada:** FRONT-VISUAL
**Pronto quando:** existem `Card`, `Badge` (4 variantes), `SectionTitle` e
`Button` (primário/secundário, estados normal/hover/desabilitado/carregando)
em `src/components/ui/`, batendo com o painel HTML. Zero regra de negócio
dentro deles. Registrados na lista de reutilizáveis do `architecture.md`.

---

## Fase B — Protótipo visual (sem lógica, sem Clerk real, sem banco)

> Todas as telas desta fase usam dados falsos e botões que não fazem nada.
> Objetivo: o Davi olhar no celular e aprovar o visual antes de existir lógica.

### B1 · Tela Entrar — visual
**Spec:** Página `/entrar`
**Camada:** FRONT-VISUAL
**Pronto quando:** `/entrar` mostra marca, um botão "Continuar com Google"
estático, o link "Solicitar acesso" e uma área reservada do tamanho do widget
do Clerk. Estados de carregando e erro renderizáveis via prop. Legível em tela
de 360px.

### B2 · Tela Cadastrar — visual
**Spec:** Página `/cadastrar`
**Camada:** FRONT-VISUAL
**Pronto quando:** `/cadastrar` mostra o aviso de acesso fechado, o botão
estático e o link "Entrar". O bloco **"e-mail não convidado"** existe e é
visualizável via prop, com o `mailto:` do Davi.

### B3 · Tela Bem-vindo — visual
**Spec:** Página `/bem-vindo`
**Camada:** FRONT-VISUAL
**Pronto quando:** `/bem-vindo` mostra saudação com nome falso, a explicação
dos 6 potes, a lista dos 8 potes (emoji, nome, %) nas cores certas do
design system, e o botão "Começar" com estados normal/enviando/erro.

### B4 · Shell autenticado — visual
**Spec:** Página "Shell autenticado"
**Camada:** FRONT-VISUAL
**Pronto quando:** o layout da área interna tem cabeçalho (nome do app + mês),
avatar falso e navegação inferior de 3 itens (Painel/Enviar/Revisar) com item
ativo destacado e alvos de toque ≥44px. Vira topo no desktop.

### B5 · Destinos vazios de `/dashboard`, `/upload` e `/revisao`
**Camada:** FRONT-VISUAL
**Pronto quando:** as três rotas existem dentro do shell com um estado vazio
("nada por aqui ainda"), só pra navegação ter pra onde ir. Conteúdo real é
de outras specs.

> ⛔ **Portão de aprovação do Davi.** Não seguir para a fase C antes do "ok" visual.

---

## Fase C — Banco de dados

### C1 · Conexão e migrations
**Camada:** BANCO
**Pronto quando:** banco Postgres (Neon/Vercel) provisionado; client server-only
em `src/lib/db.ts`; ferramenta de migration escolhida e rodando; comando de
migration documentado no readme.

### C2 · Tabela `users`
**Camada:** BANCO
**Pronto quando:** tabela criada com id do Clerk como chave primária, nome,
email (único), `criado_em`, `onboarding_concluido_em` (nullable) e coluna de
remoção lógica. Migration aplicada e reversível.

### C3 · Tabelas `buckets` e `categories`
**Camada:** BANCO
**Pronto quando:** `buckets` (user_id, nome, emoji, cor, percentual_meta
**nullable**, valor_meta em centavos, ordem) e `categories` (bucket_id, nome,
tag_visual) criadas, com FK e índice por `user_id`. Restrição impedindo dois
potes de mesmo nome pro mesmo usuário (garante a idempotência do onboarding).

### C4 · Categorias padrão de cada pote
**Camada:** BACK
**Pronto quando:** as categorias padrão de cada pote estão definidas ao lado
dos potes, em `src/features/onboarding/potes-padrao.ts`.

> **Reescrita durante a B3.** O escopo original era "criar um módulo
> server-only com os 8 potes". Os potes já foram criados na B3, porque a tela
> `/bem-vindo` precisa **exibir** a lista antes de gravar qualquer coisa — um
> módulo server-only obrigaria o visual a duplicar os dados, e passaríamos a
> ter três cópias divergindo (página de tokens, onboarding e seed). O módulo
> não é server-only e não precisa ser: nome, emoji, cor e percentual não são
> segredo. O que segue exclusivo do servidor é a **gravação** (D7) e o
> `user_id` da sessão. Sobra para a C4 só a parte que nenhuma tela exibe: as
> categorias.

### C5 · Tabela `classification_rules` + seed do Davi
**Camada:** BANCO + BACK
**Pronto quando:** tabela criada e as regras já validadas do Davi (Giulia,
Cadillac, Uber, Vivo, Total Pass, etc.) semeadas no onboarding da conta dele.
**Pode ser adiada** para a spec do motor de classificação sem quebrar nada
desta funcionalidade — é a única tarefa aqui cujo consumidor ainda não existe.

---

## Fase D — Auth e integração

### D1 · Configurar Clerk + proteção de rotas
**Spec:** "Proteção de rotas"
**Camada:** INFRA + BACK
**Pronto quando:** app do Clerk criado com **só** Google habilitado; allowlist
(Restrictions) com `davilucascarmo156@gmail.com`; chaves em variável de ambiente
(a secreta **nunca** `NEXT_PUBLIC_*`); middleware bloqueando `/dashboard`,
`/upload`, `/revisao` e `/bem-vindo` para quem não tem sessão.

### D2 · Ligar `<SignIn />` e `<SignUp />` reais
**Spec:** `/entrar` e `/cadastrar`
**Camada:** FRONT-INTEGRADO
**Pronto quando:** os widgets reais do Clerk substituem os botões estáticos de
B1/B2, estilizados via `appearance` pra bater com o design system; login com
Google funciona ponta a ponta; quem já tem sessão e abre `/entrar` vai direto
pra área interna.

### D3 · Estado "e-mail não convidado"
**Spec:** `/cadastrar`, linha da allowlist
**Camada:** FRONT-INTEGRADO
**Pronto quando:** um Google válido fora da allowlist **não acessa nenhuma
tela interna** nem ganha linha em `users`, e cai no bloco "não convidado" com
o contato do Davi e um botão de sair. Verificado com uma segunda conta Google.

> **Corrigido durante a D3.** O texto original dizia "não cria sessão". Isso
> não é alcançável por código nosso: quem cria a conta e a sessão é o Clerk,
> antes de qualquer linha nossa rodar, e não há gancho síncrono para vetar no
> meio do fluxo do Google. O que se garante é que a sessão não dá acesso a
> nada. Para barrar na origem, o caminho é ligar Restrictions → Allowlist no
> painel do Clerk — os dois se somam.

### D4 · Webhook Clerk → `users`
**Spec:** "Sincronizar usuário Clerk → Postgres"
**Camada:** BACK
**Pronto quando:** route handler trata `user.created`/`updated`/`deleted`;
assinatura inválida responde 401 sem gravar; entrega duplicada não cria linha
duplicada (`on conflict do update`); `deleted` faz remoção lógica.

### D5 · Garantia de usuário na primeira requisição
**Spec:** "usuário autentica mas o webhook ainda não chegou"
**Camada:** BACK
**Pronto quando:** existe uma função server-side que devolve o usuário do banco
e o cria se faltar, usada por toda rota interna. O app funciona mesmo com o
webhook fora do ar.

### D6 · Redirecionamentos da raiz
**Spec:** Página `/`
**Camada:** BACK
**Pronto quando:** `/` manda pra `/entrar`, `/bem-vindo` ou `/dashboard`
conforme sessão e `onboarding_concluido_em`. Decisão no servidor, sem piscar
tela intermediária.

### D7 · Concluir onboarding (gravação)
**Spec:** `/bem-vindo`, botão "Começar"
**Camada:** BACK + FRONT-INTEGRADO
**Pronto quando:** o botão chama uma server action que, **numa única
transação**, cria os 8 potes e as categorias padrão e marca
`onboarding_concluido_em`; falha não deixa nada pela metade; duplo toque não
duplica potes; `user_id` sempre vem de `auth()` no servidor, nunca do client;
sucesso redireciona pra `/dashboard`.

### D8 · Sair e sessão expirada
**Spec:** Shell autenticado
**Camada:** FRONT-INTEGRADO
**Pronto quando:** `<UserButton />` real com "Sair" voltando pra `/entrar`;
sessão expirada redireciona pra `/entrar` e, após reentrar, volta pra rota que
o usuário tentou acessar.

---

## Fase E — Deploy

### E1 · Publicar na Vercel ✅
**Camada:** INFRA
**Pronto quando:** ~~push no GitHub gera deploy~~; todas as variáveis de ambiente
configuradas na Vercel; URL do webhook do Clerk apontando pra produção; login
com Google funcionando no celular do Davi, na URL de produção.

- ✅ Variáveis configuradas em Production.
- ✅ Webhook do Clerk apontando para produção — **entrega real de
  `user.created` confirmada pelo Davi** pela aba Testing.
- ✅ Login com Google no celular, na URL de produção, confirmado pelo Davi.
- ⬜ **Critério dispensado:** "push no GitHub gera deploy". O Davi optou por
  **não** conectar o repositório à Vercel por enquanto; o deploy é feito por
  `npx vercel --prod`, que cumpre o mesmo papel. Se um dia a conexão for
  ligada, este critério volta a valer sozinho.

---

## Resumo

| Fase | Tarefas | Depende de |
|---|---|---|
| A — Fundação técnica | A1, A2, A3 | — |
| B — Protótipo visual | B1–B5 | A |
| C — Banco de dados | C1–C5 | aprovação visual de B |
| D — Auth e integração | D1–D8 | C |
| E — Deploy | E1 | D |

**Pendente fora do código:** trancar o Clerk no Google (hoje aceita também
e-mail e senha como primeiro fator). A allowlist já barra quem não é
convidado, então é redução de superfície, não correção de falha.

**Adiada:** C5 (`classification_rules` + seed do Davi) vai junto com a spec do
motor de classificação, quando as duas se desenharem juntas.

A Etapa 3 (Plan) é feita **tarefa por tarefa**, não tudo de uma vez.
