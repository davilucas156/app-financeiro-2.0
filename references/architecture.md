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
- **Banco de dados:** Postgres (Vercel Postgres / Neon).
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
    │   ├── (app)/               # (a criar, B4/B5) rotas autenticadas
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

> **Compartilhado entre comportamentos, o lugar é o pai.** `LogoGoogle` e
> `contato.ts` ficam em `autenticacao/`, não dentro de `fazer-login/` ou
> `cadastrar-usuario/`. Os dois comportamentos continuam sem depender **um do
> outro** — dependem do pai comum. Duplicar seria pior: o dia em que o e-mail
> mudasse, uma das telas ficaria com o valor velho.

> Os quatro componentes são apresentacionais e **não** levam `"use client"` —
> quem precisar de `onClick` marca a si próprio como client. Nenhum deles sabe
> o que é pote, transação ou usuário.

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