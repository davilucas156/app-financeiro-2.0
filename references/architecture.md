# Architecture — Painel Financeiro 6 Potes (app-financeiro-2.0)

> Gerado a partir do template da skill `dev-workflow-davi`. Preencher e manter
> atualizado conforme o projeto cresce. O Claude deve ler este arquivo antes
> de planejar qualquer implementação.
>
> **Status:** projeto inicializado (tarefa A1). A árvore abaixo é a real;
> as pastas marcadas com `(a criar)` ainda não existem e nascem nas tarefas
> indicadas.

## Stack

Fonte: `readme.md`, seção 4 (decisões já batidas com o Davi).
Versões instaladas na A1: Next **16.3.0**, React **19.2.8**, Tailwind **4**,
TypeScript **5**, sobre Node **20.17**.

- **Front-end:** Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS
  4, mobile-first. Gráficos com Recharts.
- **Back-end:** Server Actions e Route Handlers do próprio Next.js (não há
  serviço separado). Parsing de CSV com `papaparse`, rodando no servidor.
- **Banco de dados:** Postgres na Neon, **região São Paulo**. Acesso via
  `drizzle-orm` 0.45 + driver `@neondatabase/serverless` 1.1; migrations com
  `drizzle-kit` 0.31.
- **Auth:** Clerk.
- **Storage de arquivos:** Vercel Blob (CSVs originais, privados, por usuário).
- **LLM (fallback de classificação):** API Anthropic, chamada exclusivamente do
  servidor.
- **Hospedagem/deploy:** Vercel, deploy contínuo a partir do GitHub.

## Estrutura de pastas

```
app-financeiro-2.0/
├── .env.example                 # modelo das variáveis; .env.local fica fora do git
├── next.config.ts               # turbopack.root fixado neste diretório
├── postcss.config.mjs           # plugin do Tailwind 4
├── eslint.config.mjs            # flat config
├── tsconfig.json                # strict, alias @/* → src/*
├── readme.md                    # documento de requisitos do produto
├── planejamento_anual_davi.html # painel atual — fonte de verdade visual
├── AGENTS.md / CLAUDE.md        # gerados pelo próprio Next 16 a cada dev/build
├── references/
│   ├── architecture.md          # este arquivo
│   └── design-system.md         # cores, tipografia, potes, componentes base
├── specs/                       # Etapa 1 (specs), Etapa 2 (tarefas)
│   └── plans/                   # Etapa 3 (planos), um por tarefa
├── public/                      # assets estáticos (vazio: os SVGs do
│                                #   scaffold foram removidos na A2)
└── src/
    ├── app/                     # rotas (App Router) — só composição de tela
    │   ├── layout.tsx           # layout raiz: lang pt-br, Syne + DM Mono
    │   ├── page.tsx             # verificação de tokens; vira redirecionamento na D6
    │   ├── globals.css          # design tokens (@theme do Tailwind 4)
    │   ├── (auth)/              # rotas públicas (grupo, não vira URL)
    │   │   ├── layout.tsx       # moldura + marca
    │   │   ├── entrar/page.tsx
    │   │   └── cadastrar/page.tsx
    │   ├── (app)/               # rotas internas (grupo, não vira URL)
    │   │   ├── layout.tsx       # cabeçalho + navegação; force-dynamic
    │   │   ├── dashboard/page.tsx
    │   │   ├── upload/page.tsx
    │   │   └── revisao/page.tsx
    │   ├── bem-vindo/page.tsx   # onboarding: fora das duas molduras
    │   └── api/                 # (a criar, D4) route handlers
    ├── features/                # comportamentos isolados (ver seção abaixo)
    ├── components/
    │   └── ui/                  # componentes reutilizáveis, sem regra de negócio
    ├── db/                      # schema, migrations e queries
    └── lib/                     # clients server-only (db, clerk, anthropic, blob)
```

> `src/features`, `src/components/ui`, `src/db` e `src/lib` existem com um
> `.gitkeep` cada (o git não versiona pasta vazia). O `.gitkeep` sai quando a
> pasta ganhar o primeiro arquivo de verdade.

Regra: `src/app/**` contém apenas o esqueleto da rota (layout, metadata,
composição). Toda a lógica de um comportamento vive em `src/features/**`.

## Convenção de isolamento por comportamento

Cada página organiza seus comportamentos em subpastas isoladas dentro de
`src/features/`:

```
src/features/
├── autenticacao/
│   ├── fazer-login/
│   └── cadastrar-usuario/
├── upload-extrato/
│   ├── enviar-csv/
│   └── parsear-csv/
├── classificacao/
│   ├── aplicar-regras/               # motor determinístico
│   ├── sugerir-via-llm/              # fallback Anthropic
│   └── criar-regra-a-partir-de-correcao/
├── revisao-transacoes/
│   ├── revisar-transacao/
│   └── confirmar-mes/
└── dashboard/
    ├── ver-resumo-do-mes/
    ├── ver-potes/
    └── ver-comparativo-anual/
```

Arquivos dentro de cada pasta de comportamento:

| Arquivo | Papel | Camada |
|---|---|---|
| `<Comportamento>.tsx` | Componente de UI (client component) | front-end |
| `<comportamento>.action.ts` | Server Action — porta de entrada do back-end | back-end |
| `<comportamento>.service.ts` | Regra de negócio (server-only) | back-end |
| `<comportamento>.types.ts` | Tipos compartilhados entre as duas pontas | — |

Consertar "recuperar senha" significa mexer só em `recuperar-senha/`. Se um
plano precisar tocar arquivos de outro comportamento, isso tem que estar
explícito no plano (Etapa 3) e aprovado antes.

## Regra Thin Client, Fat Server

- O front-end nunca contém: regra de negócio, chave/token/segredo, ou validação
  que sozinha garanta segurança.
- O back-end é dono de: validação real, regras de negócio, acesso a dados
  sensíveis.

Aplicações específicas deste projeto:

1. **Chave da API Anthropic** vive só em variável de ambiente do servidor
   (nunca `NEXT_PUBLIC_*`). A chamada acontece em Server Action / Route Handler.
   O browser jamais fala com a API da Anthropic.
2. **Motor de classificação** (regras determinísticas + fallback LLM) é 100%
   server-side. O front-end só exibe o resultado e captura a correção do usuário.
3. **Isolamento por usuário é manual.** Não há RLS aqui (Clerk + Neon são
   serviços separados). Toda query obrigatoriamente filtra por `user_id` obtido
   da sessão autenticada no servidor (`auth()` do Clerk) — **nunca** por um
   `user_id` vindo do client. Isso vale sem exceção; qualquer query sem esse
   filtro é um bug de segurança.
4. **Parsing e cálculo financeiro** rodam no servidor. O front-end não recalcula
   totais de pote nem decide categoria.
5. Validação no front-end é aceitável só como UX (feedback rápido), sempre
   duplicada no servidor.

## Banco de dados — como mexer

```
npm run db:generate   # schema.ts mudou → gera o .sql em src/db/migrations
npm run db:migrate    # aplica os .sql pendentes no banco
npm run db:studio     # inspeção visual das tabelas
```

`src/db/schema.ts` é a fonte de verdade. **Nunca alterar o banco à mão:** toda
mudança nasce no schema, vira `.sql` versionado e é aplicada pelo comando. O
`.sql` é legível de propósito — dá para ler o que vai rodar antes de rodar,
que é o mínimo num banco com dados financeiros.

O client fica em `src/lib/db.ts`, exportando `getDb()`:

- **`import "server-only"`** no topo faz o **build falhar** se um componente de
  cliente importar o banco. Verificado na C1 com uma rota descartável: o build
  saiu com erro, nomeando `db.ts` e o componente. É a regra Thin Client / Fat
  Server virando erro de compilação, não recomendação escrita.
- **Driver `neon-serverless` (Pool/WebSocket), não `neon-http`.** O HTTP não
  suporta transação interativa, e gravar os potes do onboarding exige uma
  transação de verdade — falha não pode deixar a conta pela metade.
- **Inicialização preguiçosa e cacheada no `globalThis`**: sem `DATABASE_URL`
  o build continua passando, o erro só aparece na primeira consulta e diz o
  que fazer; e o hot reload não abre um pool novo a cada salvamento.

**Duas URLs, dois usos.** `DATABASE_URL` passa pelo pooler e é a da
aplicação; `DATABASE_URL_UNPOOLED` é conexão direta e é a das **migrations**
(o `drizzle.config.ts` usa ela). Pooler e DDL não se dão bem.

**`neonConfig.webSocketConstructor = ws` é obrigatório.** O driver do Neon
conversa por WebSocket e o Node 20 não tem `WebSocket` global — só o Node 22
tem. Sem essa linha em `db.ts`, toda consulta morre com "All attempts to open
a WebSocket... failed". Descoberto na C2 testando contra o banco real; o
`db:migrate` não denuncia o problema porque o drizzle-kit embute o próprio
WebSocket.

**Migrations são só para frente.** O drizzle-kit não gera arquivo de *down* —
nem ele nem o Prisma, é o padrão atual. Reverter é escrever uma migration nova
que desfaz. Por isso o `.sql` gerado precisa ser lido antes de aplicar.

### Tabelas

- **`users`** — PK é o `user.id` do **Clerk**, não um serial nosso: duas
  identidades para a mesma pessoa seria fonte garantida de bug. `email` único,
  `nome` nulo (perfil do Google pode não ter), `onboarding_concluido_em` nulo
  = pendente (é o que a D6 lê), `removido_em` para remoção lógica — apagar a
  linha levaria junto meses de histórico financeiro. Datas em `timestamptz`:
  sem fuso, um registro às 23h em São Paulo cai no dia seguinte, e "mês de
  referência" é o eixo do produto.

- **`buckets`** — os potes, um conjunto por usuário. `percentual_meta` e
  `valor_meta_centavos` são nulos nos dois potes fora do rateio (Manutenção e
  Outros/Repasses), e `observacao` guarda o que a tela mostra no lugar —
  "0%" leria como meta zerada. Percentual é inteiro: o produto usa
  percentuais cheios, e aceitar 12,5% na fase 2 exigirá migration de tipo.
- **`categories`** — subcategorias dentro de um pote. `emoji` é coluna própria
  porque no painel a categoria aparece como "⛽ Gasolina" — o emoji é parte do
  rótulo, e embuti-lo no `nome` sujaria o dado que o usuário vai editar.

**Duas restrições de unicidade por tabela, com propósitos diferentes.**
`(user_id, nome)` impede dois potes com o mesmo rótulo na tela.
`(user_id, slug)` é o que garante a **idempotência do onboarding**: a
idempotência não pode depender do nome, porque na fase 2 o usuário poderá
renomear os potes e o seed deixaria de se reconhecer.

**`categories` carrega `user_id` mesmo sendo derivável do pote.** É
desnormalização deliberada, por segurança e não por conveniência: sem RLS, a
regra "toda query filtra por `user_id` da sessão" precisa ser aplicável em
**toda** tabela. Sem a coluna, cada consulta precisaria de um `join` só para
provar posse, e qualquer esquecimento vira vazamento entre contas a partir de
um `bucket_id` vindo do cliente. O custo é manter os dois campos coerentes na
escrita, que acontece num lugar só (D7).

A credencial vem da Vercel: `npx vercel env pull .env.local`.

## Componentes/módulos reutilizáveis já existentes

> Lista viva — atualizar sempre que criar algo reutilizável, pra evitar
> duplicação em tarefas futuras.

- **Design tokens** — `src/app/globals.css` — cores, fontes e raios do produto
  como `@theme` do Tailwind 4. Gera as classes `bg-card`, `text-dim`,
  `bg-pote-lib`, `rounded-card`, `font-mono`, etc. Cores dos 8 potes usam o
  prefixo `pote-` para não se misturarem às semânticas. **Nenhuma cor literal
  (`#hex`, `text-[#...]`) deve aparecer em componente** — se falta um token,
  acrescente aqui e em `references/design-system.md`.
- **Fontes** — `src/app/layout.tsx` — Syne (variável) e DM Mono (300/400/500)
  auto-hospedadas via `next/font/google`, expostas como `--font-syne` e
  `--font-dm-mono`. Regra visual: rótulo uppercase é `font-mono`, conteúdo é a
  fonte padrão.
- **`cn()`** — `src/lib/cn.ts` — junta classes ignorando valores falsos.
  Existe para não trazer `clsx`/`cva` neste tamanho de projeto.
- **`Card`** — `src/components/ui/Card.tsx` — superfície padrão (`.panel`/`.sc`
  do painel). Aceita `className` para espaçamento/largura, não para repintar.
- **`Badge`** — `src/components/ui/Badge.tsx` — pill uppercase DM Mono;
  variantes `green` | `gold` | `blue` | `dim`. As coloridas levam o ponto `●`
  (decorativo, `aria-hidden`); `dim` não leva.
- **`SectionTitle`** — `src/components/ui/SectionTitle.tsx` — rótulo + régua.
- **`Button`** — `src/components/ui/Button.tsx` — `primary` | `secondary`,
  altura mínima de 44px (alvo de toque), `type="button"` por padrão e
  `loading` que desabilita o elemento (duplo toque não dispara duas vezes).
  Hover usa o variante `enabled:`, senão o botão desabilitado reagiria ao mouse.

- **Moldura pública** — `src/app/(auth)/layout.tsx` — coluna centrada com a
  marca ("Painel Financeiro / 6 Potes"). Compartilhada por `/entrar` e
  `/cadastrar`; a marca vive aqui para as duas telas não divergirem.
- **`LogoGoogle`** — `src/features/autenticacao/LogoGoogle.tsx` — SVG inline.
- **`EMAIL_CONTATO` / `linkSolicitarAcesso()`** — `src/features/autenticacao/contato.ts`.
- **`POTES_PADRAO` / `rotuloMeta()`** — `src/features/onboarding/potes-padrao.ts`
  — os 8 potes do onboarding. Carrega `hex` (para o seed no banco) **e**
  `classeCor` (para renderizar), porque tem dois consumidores: a tela
  `/bem-vindo` e o seed das tarefas C3/D7. Dinheiro em centavos.
  `rotuloMeta()` existe para nunca renderizar "0%" nos dois potes sem
  percentual — "0%" leria como meta zerada, e não como "fora do rateio".
  Traz também as **22 categorias padrão**, extraídas das tags
  `<span class="tag t-*">` dos meses já fechados no painel HTML e da seção 7
  do `readme.md`. Nenhuma categoria foi inventada — "Metas / Sonhos" tem uma
  só (Giulia) porque é o que existe.

> **Compartilhado entre comportamentos, o lugar é o pai.** `LogoGoogle` e
> `contato.ts` ficam em `autenticacao/`, não dentro de `fazer-login/` ou
> `cadastrar-usuario/`. Os dois comportamentos continuam sem depender **um do
> outro** — dependem do pai comum. Duplicar seria pior: o dia em que o e-mail
> mudasse, uma das telas ficaria com o valor velho.

- **`EstadoVazio`** — `src/components/ui/EstadoVazio.tsx` — emoji, título,
  explicação e ação opcional. Tela sem dados diz o que falta e qual o próximo
  passo, em vez de um vazio mudo.
- **Moldura interna** — `src/app/(app)/layout.tsx` + `src/features/shell/` —
  cabeçalho fixo (app, mês, avatar) e navegação. `rotas.ts` é a definição
  única das três rotas internas: acrescentar rota é acrescentar entrada lá,
  não editar um `<nav>` à mão.

> **A moldura interna não protege nada.** Quem bloqueia requisição sem sessão
> é o `src/middleware.ts` (D1), no servidor. Renderizar o shell nunca é
> evidência de que o usuário está autenticado.

## Autenticação e proteção de rotas

`src/proxy.ts` roda o `clerkMiddleware` antes de qualquer renderização.
A decisão de acesso é do servidor; nenhuma tela decide se pode ser vista.

> O arquivo chama-se `proxy.ts`, e não `middleware.ts`: o Next 16 depreciou a
> convenção `middleware` em favor de `proxy`. O conteúdo é o mesmo.

**As telas de auth são rotas catch-all** (`entrar/[[...rest]]`,
`cadastrar/[[...rest]]`) porque os fluxos do Clerk navegam para sub-rotas
próprias (`/entrar/sso-callback`, …). Numa rota simples isso dá 404 no meio do
login. A URL que o usuário vê continua `/entrar`.

**Acesso por convite (D3).** Ter sessão não basta. O `proxy.ts` também
verifica se o e-mail está em `EMAILS_CONVIDADOS` — variável **sem** prefixo
público, separada por vírgula, comparada normalizada. Quem não está cai em
`/cadastrar?acesso=negado`.

- **Lista vazia = ninguém entra.** Se a variável sumir num deploy, o app
  tranca em vez de abrir. Um app financeiro que falha aberto é pior do que um
  que falha fechado. Falha ao consultar o Clerk também nega.
- **A verificação mora no proxy**, não numa tela nem no layout de `(app)`:
  é o único ponto que cobre tudo que a lista de rotas protegidas cobre. Uma
  rota interna futura criada fora daquele grupo escaparia de uma checagem
  feita no layout.
- **`/cadastrar?acesso=negado` não redireciona quem tem sessão.** Sem essa
  exceção há laço infinito: o proxy manda para lá, a página manda de volta
  para `/dashboard`, o proxy manda para lá de novo.
- **Custo conhecido:** o e-mail não vem nos claims padrão, então há uma
  consulta ao Clerk por requisição de rota interna. Irrelevante neste
  tamanho; se incomodar, publicar o e-mail como claim customizado.

**Aparência do Clerk:** `src/features/autenticacao/aparencia-clerk.ts`, com as
cores vindo de `var(--color-*)` em vez de hex. Atenção aos nomes: o **Core 3
renomeou** as variáveis — não existem mais `colorText`, `colorTextSecondary`,
`colorInputBackground` nem `colorInputText`; o par é `color*` /
`color*Foreground`.

⚠ **Rota interna nova NÃO é protegida automaticamente.** A lista de rotas
protegidas é escrita à mão no middleware, e isso é deliberado: derivá-la de
`src/features/shell/rotas.ts` faria com que remover um item do menu — decisão
puramente visual — tirasse a rota da proteção junto, em silêncio. Ao criar
rota interna, acrescente ao matcher.

Protegidas hoje: `/dashboard`, `/upload`, `/revisao` e `/bem-vindo`.
`/bem-vindo` está lá mesmo não aparecendo no menu.

**Não usar `auth.protect()` sozinho.** Ele responde **404** para quem não tem
sessão — verificado na D1. Esconder a rota não é o comportamento da spec: quem
chega sem sessão deve ser convidado a entrar, não levar a impressão de que a
página não existe. O middleware usa `redirectToSignIn({ returnBackUrl })`, que
devolve 307 para `/entrar` **e preserva a rota tentada** na query string.

**O `<ClerkProvider>` está no layout raiz**, então o app **não roda sem as
chaves do Clerk** — nem as telas públicas. `.env.local` precisa de
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`; a secreta nunca
leva o prefixo público. Isso vale para a Vercel também: sem as chaves lá, o
deploy sobe e responde erro.

> Os componentes de `ui/` são apresentacionais e **não** levam `"use client"` —
> quem precisar de `onClick` marca a si próprio como client. Nenhum deles sabe
> o que é pote, transação ou usuário.
>
> **Único `"use client"` do projeto:** `NavegacaoPrincipal`, porque destacar o
> item ativo exige `usePathname()`. Não é precedente para componente novo
> nascer client — a justificativa tem que ser um hook de verdade.

## Padrões e decisões

- **Server Actions em vez de API REST própria** — o app é um monolito Next.js
  em uma única Vercel; não há cliente externo consumindo a API, então Server
  Actions reduzem boilerplate sem perder o "fat server".
- **Idioma do código:** nomes de pastas de comportamento e de domínio em
  português (espelham a linguagem do produto); nomes técnicos de framework
  seguem a convenção da lib (`page.tsx`, `layout.tsx`).
- **Mobile-first:** todo layout começa pelo breakpoint pequeno; desktop é
  progressive enhancement.
- **Nada de LLM classificando direto pro dashboard** — sugestão do LLM sempre
  passa pela tela de revisão antes de virar dado consolidado (readme, seção 7.1).
- **Dinheiro em inteiros (centavos)** no banco, para evitar erro de ponto
  flutuante em soma de potes. Formatação em R$ só na borda de exibição.
```
### Armadilha do Clerk: cores por token não funcionam

A configuração de aparência (`src/features/autenticacao/aparencia-clerk.ts`)
usa **hex literal**, e é a única exceção à regra de não usar cor literal em
componente.

O Clerk deriva por cálculo as cores de texto e borda dos botões a partir das
variáveis. Passando `var(--color-card)`, o cálculo devolve **preto** — e num
tema escuro isso vira texto preto sobre fundo preto: o widget renderiza, está
todo no DOM, e mesmo assim aparece como uma caixa vazia.

Medido em navegador real: com `var()`, o texto do botão sai
`srgb 0 0 0 / 0.62`; com hex, `srgb 0.35 0.35 0.44 / 0.62`.

Custou três rodadas de diagnóstico porque o sintoma ("não aparece nada")
sugere componente que não montou, quando na verdade é componente invisível.
Ao mexer em aparência do Clerk, **verifique cor computada em navegador**, não
a presença do elemento.
