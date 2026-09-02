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
- **Storage de arquivos:** nenhum. O CSV original **não é guardado** — spec
  02, C3. O que faltava sem ele eram as linhas que o leitor não entendeu, e
  essas moram em `imports.ignoradas`. A coluna `url_no_blob` foi removida em
  30/08/2026 (migration 0012).
- **LLM (fallback de classificação):** API Anthropic, chamada exclusivamente do
  servidor.
- **Hospedagem/deploy:** Vercel, por **CLI** — `npx vercel deploy --prod
  --yes`. ⚠ O projeto **não** está conectado ao Git: `git push` é backup, e
  não gatilho de deploy. Domínio estável: `app-financeiro-plum.vercel.app`.

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
    └── lib/                     # cliente do banco e utilitários sem dono
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

## Testes

| Tipo de código | Como se verifica |
|---|---|
| Camada pura (sem banco, sem sessão) | **Vitest** — `npm test`. Os testes ficam no repositório |
| Qualquer coisa com `server-only` | Rota temporária dentro do runtime do Next, apagada antes do commit |

A divisão não é gosto: `import "server-only"` **impede** o módulo de rodar
fora do Next, e é assim que deve ser. O que não tem essa marca — hoje o leitor
de extrato — é testável de verdade, e converte dinheiro, então merece teste que
sobrevive em vez de rota que eu apago.

⚠ **O config é `vitest.config.mts`, não `.ts`.** O Vitest 4 é ESM puro e o
`package.json` não declara `"type": "module"`; num `.ts` o arquivo carrega como
CommonJS e morre com `ERR_REQUIRE_ESM`. Em ESM também não existe `__dirname` —
o alias `@` usa `import.meta.dirname`.

**Amostras de extrato vivem como strings em TypeScript**
(`src/features/upload/ler-arquivo/amostras.ts`), nunca como `.csv`: arquivo de
extrato está no `.gitignore` por carregar dado financeiro real, e amostra em
código fica obviamente sintética e não some do repositório.

## Formatação — a regra está escrita, e é verificável

**O projeto é formatado por Prettier**, versão fixa (`3.9.6`, sem `^`) em
`devDependencies`. A config é `prettier.config.mjs`; o que ela não formata está
em `.prettierignore`.

```
npm run format         # formata
npm run format:check   # só confere, não escreve
```

⚠ **Isto é recente, e nasceu de um acidente.** Até 27/08/2026 não havia config
nem dependência: o estilo existia só na mão de quem escrevia. Rodar `npx
prettier --write` "para arrumar um arquivo" reformatava tudo, e **139 arquivos
alheios entraram no commit de uma funcionalidade** (spec 12). Foi desfeito antes
de subir. A lição não é "não rode o formatador" — é que **uma regra que mora na
lembrança de alguém falha uma hora**.

### O que ficou de fora, e por quê

| Ignorado                | Motivo                                                     |
| ----------------------- | ---------------------------------------------------------- |
| `*.md`                  | specs e referências têm quebra de linha **deliberada**      |
| `src/db/migrations/`    | gerado pelo Drizzle — reformatar cria briga com a ferramenta |
| `planejamento_anual_davi.html` | documento de origem, não fonte que a gente mantém    |
| `*.code-workspace`      | escrito pelo próprio VS Code                                |

O `*.md` é o que mais importa. Formatador não sabe que um aviso isolado está
isolado de propósito, nem que o parágrafo é curto porque a ideia é curta.

### A adoção, e como ela foi conferida

60 arquivos de `src/` mudaram, num commit sozinho, sem funcionalidade junto.
Formatação não muda comportamento — mas *dizer* isso não prova nada, então foi
conferido dos dois jeitos:

1. **`tsc`, `eslint` e os 611 testes** passaram depois da reformatação.
2. **Comparação caractere a caractere ignorando espaço em branco**, arquivo por
   arquivo contra a versão anterior. Sobraram 11 diferenças, todas do mesmo
   punhado de categorias inócuas: o `|` inicial de um `type` união que passou a
   caber numa linha, o `;` que aparece depois do último campo quando um tipo
   inline é quebrado, um par de parênteses de `return` que sumiu, e um `{" "}`
   de JSX que o Prettier **acrescentou** justamente para preservar o espaço que
   a quebra de linha comeria.

⚠ **Esse commit polui o `git blame`** dos 60 arquivos. Por isso existe o
`.git-blame-ignore-revs`. Para o Git passar a respeitá-lo:

```
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

É por repositório e por máquina — quem clonar de novo roda outra vez.

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

  ⚠ **`percentual_meta` tem dois escritores desde a spec 13**, e é a coluna
  mais fácil de procurar no lugar errado: o **seed** do onboarding a semeia
  com 30/25/15/15/10/5, e a **`/categorias`** a reescreve
  (`categorias/definir-meta/`). Quem for atrás de "de onde veio este número"
  precisa saber que a semente é o ponto de partida, e não a resposta.

  `valor_meta_centavos` **continua sem nenhum leitor** — a spec 13 decidiu
  não acordá-la (Pendência 2): meta em reais conviveria com o percentual e
  pediria uma regra de precedência em toda tela.
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
- **A cor do pote nos dois temas** — `src/features/aparencia/tema/` — a cor
  vem de `buckets.cor`, no Postgres, e por isso **nenhuma variável de CSS a
  alcança**. São duas funções, e a diferença entre elas é a régua:
  - `corParaFundoClaro(hex)` — para **preenchimento** (barra, faixa, bolinha).
    Mira **3**, que é o mínimo do WCAG para uma forma ser percebida.
  - `corParaTexto(hex, fundo)` — para **letra** (spec 15). Mira **4.5**, e
    recebe o fundo porque no escuro ela precisa clarear e no claro escurecer.

  ⚠ **A régua muda com o uso, e não com o gosto.** Exigir 4.5 do preenchimento
  escureceria os nove potes muito além do necessário; aceitar 3 na letra deixa
  o número do cartão do ano ilegível. As duas preservam o matiz, porque a cor
  **é** a identidade do pote.

  Quem as leva ao elemento é `estiloDoPote` (fundo) e `estiloDoTextoDoPote`
  (letra), cada uma com **nomes de variável próprios** — as duas versões da
  mesma cor não são o mesmo valor, e um cartão pode ter as duas.
- **`cn()`** — `src/lib/cn.ts` — junta classes ignorando valores falsos.
  Existe para não trazer `clsx`/`cva` neste tamanho de projeto.
- **`Card`** — `src/components/ui/Card.tsx` — superfície padrão (`.panel`/`.sc`
  do painel). Aceita `className` para espaçamento/largura, não para repintar.
- **`Voltar`** — `src/components/ui/Voltar.tsx` — o caminho de volta das rotas
  que ficam **fora da barra de navegação** (`/comparativo`, `/categorias`,
  `/configuracoes`, `/formatos`, `/passos`). Recebe `para` e o nome do destino;
  a seta é decorativa e o leitor de tela ouve “Voltar para …”.

  ⚠ **Ele existe porque a mesma linha estava copiada cinco vezes e uma já
  tinha divergido** — quatro telas em `text-3xs`, a `/configuracoes` em
  `text-4xs`. Rota nova fora da barra usa este componente; não copie o
  `<Link>` de uma tela vizinha.

  ⚠ **Não confundir com o `AcaoDeVoltar` da `/revisao`**, que desfaz uma
  classificação. Os dois dizem “← Voltar” e fazem coisas diferentes: um navega,
  o outro age. A diferença de letra — mono em caixa alta contra texto normal —
  é o que impede que se pareçam.
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
- **`estaConvidado()`** — `src/features/autenticacao/allowlist.ts` — o portão
  do acesso por convite. Usado em **três** lugares (proxy, webhook, garantia de
  primeira requisição); nenhum deles reimplementa a checagem.
- **`salvarUsuario()`** — `src/features/autenticacao/salvar-usuario.ts` — a
  **única** gravação de usuário do projeto (server-only). Carrega o portão da
  allowlist e o `on conflict (id) do update`. Chamada pelo webhook (D4) e pela
  garantia de primeira requisição (D5): duas cópias divergiriam, e a que
  divergisse viraria a porta dos fundos por onde entra quem a D3 barrou.
- **`destinoInicial()` / `destinoDoUsuario()`** —
  `src/features/autenticacao/destino-inicial.ts` — para onde o usuário vai, ver
  a seção "Destino inicial" abaixo.
- **`obterUsuarioAtual()` / `garantirUsuario()`** —
  `src/features/autenticacao/garantir-usuario/garantirUsuario.service.ts` — ver
  a seção "Garantia de usuário" abaixo.
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
> é o `src/proxy.ts` (D1), no servidor. Renderizar o shell nunca é evidência
> de que o usuário está autenticado. O que a moldura **faz** é chamar
> `garantirUsuario()` (D5), porque é o único ponto por onde as três rotas
> internas passam sem exceção.

### `imports` e `transactions` (C1/C2 da spec 02)

`imports` guarda **um registro por arquivo enviado**. Não está no `readme.md`,
e existe por duas perguntas que nada mais responde: "esse arquivo já foi
enviado?" e "o que apagar quando o usuário desfizer?".

`transactions` guarda os lançamentos. `categoria_id` nasce **nulo** e continua
nulo até a spec de classificação.

| Restrição | O que garante |
|---|---|
| `unique (user_id, impressao)` | Reimportar não duplica lançamento |
| `unique (user_id, hash)` | Reenviar o mesmo arquivo é reconhecido |

**A idempotência mora no banco, não em `if`** — mesma decisão que
`(user_id, slug)` tomou pelos potes na D7. Duas requisições simultâneas não
furam uma restrição de unicidade; nenhuma checagem em código promete isso.

`user_id` entra nos dois únicos porque a impressão e o hash não incluem o
usuário: sem ele, dois usuários com o mesmo lançamento colidiriam, e o segundo
perderia um lançamento real por causa do primeiro.

- **`data` é `date` lida como string.** `timestamp` obrigaria a inventar um
  horário que não existe no extrato, e o fuso moveria o lançamento de dia.
- **`par_de` guarda a impressão, não um id**: na hora de inserir, o outro lado
  do par ainda não tem `id`.
- **`text` + `check` em vez de `enum` do Postgres**: acrescentar valor a um
  `enum` exige `ALTER TYPE`, e a spec de classificação vai acrescentar status.
- **Apagar categoria faz `set null`, não `cascade`** — apagar uma categoria não
  pode apagar meses de histórico financeiro.

> ⚠ **`imports` tem dois caminhos de deleção desde a spec 14**, e quem for atrás
> de "por que este envio sumiu" precisa saber dos dois:
>
> - **por envio**, na `/upload` (`upload/desfazer-envio/`, spec 02) — a unidade é
>   o arquivo, e o id vem do cliente, por isso há conferência de dono antes de
>   apagar;
> - **por mês**, no pé da `/dashboard` (`painel/remover-o-mes/`, spec 14) — a
>   unidade é o mês, e ela apaga **os envios que o formaram**. Não há conferência
>   de dono ali de propósito: um mês não é alça de nada, só vira linha depois de
>   cruzar com o `user_id` da sessão.
>
> ⚠ **Remover o mês tem de apagar a linha de `imports`, não só os lançamentos.**
> Com a linha viva, o `unique (user_id, hash)` recusaria o reenvio do arquivo
> corrigido — que é a próxima coisa que se quer fazer depois de tirar um mês
> errado. O botão viraria uma armadilha.
>
> ⚠ **E um envio pode alimentar dois meses**: `mesDoLancamento` arquiva
> lançamento de conta pelo mês da **data**, então o extrato que cruza a virada
> põe linhas no mês seguinte. Remover um mês leva essas linhas junto, e a tela
> conta isso antes de confirmar.

> ⚠ **O Drizzle envolve o erro do Postgres: o nome da constraint vive em
> `error.cause`, não em `error.message`.** Um teste que só olha a mensagem
> reporta falha justamente quando o banco fez o certo. Já me custou uma
> rodada de diagnóstico.

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

### Webhook do Clerk (D4)

`src/app/api/webhooks/clerk/route.ts` recebe `user.created`/`updated`/
`deleted`. A verificação de assinatura é do próprio SDK (`verifyWebhook`, com
`CLERK_WEBHOOK_SIGNING_SECRET`) — não há verificação caseira.

A regra fica separada em
`src/features/autenticacao/sincronizar-usuario/sincronizarUsuario.service.ts`,
para ser testável sem forjar uma requisição assinada.

**Códigos de resposta são deliberados**, porque o Clerk reenvia em backoff por
horas quando não recebe 200:

| Situação | Resposta |
|---|---|
| Assinatura inválida | **401**, sem tocar no banco |
| Evento que não interessa | **200**, para não gerar reenvio à toa |
| Falha de banco | **500** — o único caso em que reenviar ajuda |

- **Idempotência:** `on conflict (id) do update`. Entrega duplicada converge
  para o mesmo estado em vez de duplicar linha.
- **`user.deleted` é remoção lógica** (`removido_em`). Apagar a linha levaria
  junto meses de histórico financeiro.
- **O webhook usa o mesmo portão da allowlist (D3).** É isso que cumpre a
  promessa de que quem não foi convidado não ganha linha em `users` — sem
  isso, qualquer pessoa que autenticasse no Google viraria registro no banco.

### Garantia de usuário na primeira requisição (D5)

O webhook é **assíncrono e externo**. Entre o Google devolver a sessão e o
Clerk entregar `user.created` existe uma janela em que o usuário está
autenticado e não existe no nosso banco — normalmente milissegundos, infinita
se o webhook estiver mal configurado ou fora do ar.

`src/features/autenticacao/garantir-usuario/garantirUsuario.service.ts` fecha
essa janela. Duas portas, de propósito:

| Função | Sem sessão / sem convite | Quem usa |
|---|---|---|
| `obterUsuarioAtual()` | devolve `null` | D6, que precisa **decidir** o destino |
| `garantirUsuario()` | `redirect("/entrar")` | rotas internas, que não têm decisão a tomar |

Chamada em `src/app/(app)/layout.tsx` e em `/bem-vindo`. **Rota interna nova
precisa chamar uma das duas** antes de ler qualquer coisa por `user_id`.

- **Caminho quente é um `SELECT` por chave primária.** Só quando a linha falta
  é que se paga uma ida ao Clerk (`currentUser()`) — o que acontece uma vez na
  vida da conta, ou enquanto o webhook estiver quebrado.
- **Consequência assumida:** com o webhook fora do ar, uma troca de nome no
  Google não chega aqui. Sincronizar a cada requisição custaria uma chamada de
  API por página para corrigir algo que o webhook corrige sozinho.
- **`cache()` do React**, porque layout e página chamam cada um por conta
  própria no mesmo render. É por requisição — uma sessão não enxerga a outra.
- **`userId` sempre vem de `auth()`.** A parte que fala com o banco recebe o
  id como parâmetro, mas **não é exportada**: uma função exportada que aceita
  `userId` de fora é, no primeiro descuido, um jeito de ler a conta alheia.
- **Linha com `removido_em` e sessão viva** é contradição — só `user.deleted`
  escreve ali, e conta apagada no Clerk não tem sessão. A marca é limpa.

> ⚠ **Insert ou update, num upsert, se descobre com `xmax = 0`** — numa linha
> recém-inserida o `xmax` é zero. A primeira versão comparava `criado_em` com
> `atualizado_em` e chamava de "criado" o que caísse dentro de um segundo:
> classificava errado toda atualização logo após a criação, que é justamente o
> caso comum (o webhook chega segundos depois da D5 já ter gravado). Só
> apareceu quando o teste da D5 exercitou os dois caminhos em sequência.

### Destino inicial (D6)

`src/features/autenticacao/destino-inicial.ts` responde a única pergunta que
quatro rotas fazem:

| Estado | Destino |
|---|---|
| Sem sessão | `/entrar` |
| Sessão, e-mail fora da allowlist | `/cadastrar?acesso=negado` |
| Sessão, convidado, onboarding pendente | `/bem-vindo` |
| Sessão, convidado, onboarding concluído | `/dashboard` |

A segunda linha não está na spec da raiz: é consequência da D3. Quem não foi
convidado **tem** sessão, e mandá-lo para `/dashboard` só o faria bater no
proxy e voltar.

Chamam: `/` (que não tem tela — decide e desvia), `/entrar`, `/cadastrar` e
`/bem-vindo`. Até a D5, três delas respondiam com um `/dashboard` fixo que a
D2 deixou provisório, e nenhuma sabia de `onboarding_concluido_em`.

- **A decisão é de Server Component, com `redirect()` antes de renderizar.** O
  navegador recebe 307 e nunca pinta tela de espera.
- **`destinoDoUsuario()` é pura** (recebe `Usuario`, não consulta nada), para
  ser exercitável nos quatro estados. Pela porta de cima só se alcança o
  estado que a sessão do momento permite.
- **`/entrar` grava no banco**, e isso é intencional: a spec diz que o
  primeiro acesso grava o usuário. Visitante anônimo não paga — sem `userId`,
  `obterUsuarioAtual()` sai antes de tocar no banco.

> ⚠ **Duas telas públicas não podem ser redirecionadas do mesmo jeito.**
> `/cadastrar` precisa **ficar** quando o destino é `/entrar`: é a tela de
> solicitar acesso, e mandar o visitante anônimo para `/entrar` fecha o laço
> "entrar → solicitar acesso → entrar". Esse laço já apareceu de verdade uma
> vez, e a primeira versão da D6 o recriou — só apareceu ao bater nas seis
> rotas por HTTP, não no build nem no tipo.

### Onboarding — a gravação (D7)

`src/features/onboarding/concluir-onboarding/` — o botão "Começar" grava, numa
**única transação**, 8 potes, 22 categorias e `onboarding_concluido_em`.

São 8 e não 6: os dois de fora do rateio (`percentual_meta` nulo) existem
desde a C3. Criar só 6 deixaria gasto sem pote onde cair.

| Arquivo | Papel |
|---|---|
| `seed.ts` | traduz `POTES_PADRAO` para linhas do banco. Sem sessão, sem transação |
| `concluirOnboarding.service.ts` | a transação |
| `concluirOnboarding.action.ts` | server action; pega o usuário de `garantirUsuario()` |
| `AcaoComecar.tsx` | o único pedaço de cliente da tela |

- **A transação é o motivo de a C1 ter escolhido o driver WebSocket** do Neon
  em vez do HTTP: o HTTP não tem transação interativa. Falhar no meio das
  categorias deixaria 8 potes vazios com o onboarding marcado — e a D6 não
  traria mais o usuário de volta para consertar.
- **Idempotência em três camadas:** botão desabilitado (cliente), `on conflict
  do nothing` nas duas tabelas, e saída antecipada se já concluiu. Nenhuma
  sozinha basta — cliente desabilitado não é garantia de nada.
- **O `update` de `onboarding_concluido_em` tem `is null` na condição**, para
  duas requisições simultâneas não deslocarem a data para frente.
- **A tela continua Server Component**; só `AcaoComecar` é cliente, então
  `POTES_PADRAO` inteiro não entra no bundle.
- **`classification_rules` ficou de fora** (C5, adiada para a spec do motor de
  classificação): a tabela não existe, e criá-la só para semear seria
  construir o consumidor depois do consumido.

> ⚠ **`on conflict do nothing` não devolve a linha que já existia.** O mapa
> `slug → id` dos potes vem de um `select` depois do insert, não do
> `returning`. Com `returning`, a segunda execução voltaria vazia e nenhuma
> categoria acharia seu pote.

> ⚠ **`redirect()` do Next funciona lançando uma exceção.** Dentro de um
> `try/catch` em volta da gravação, o `catch` o engoliria e a tela mostraria
> "erro" logo depois de gravar tudo com sucesso. O redirect fica **fora**.

### Sair e sessão expirada (D8)

- **`<UserButton />` real** no `CabecalhoApp`, com a `APARENCIA_CLERK`. O
  cabeçalho perdeu a prop `nome`: quem sabe nome e foto é o Clerk, e sem foto
  o widget cai para iniciais sozinho. A moldura de `(app)` continua chamando
  `garantirUsuario()` — a chamada nunca foi pelo nome, é a garantia da linha
  (D5) antes de qualquer filha ler por `user_id`.
- **Voltar para a rota tentada** já vinha montado: `returnBackUrl: req.url` no
  proxy (D1) põe o `?redirect_url=`, e `fallbackRedirectUrl` — **fallback**, não
  `force` — deixa esse parâmetro vencer.
- **`fallbackRedirectUrl` é `/`**, nas duas telas de acesso. Com `/dashboard`,
  quem entrava sem `redirect_url` (o caso normal) aterrissava no painel mesmo
  sem ter feito onboarding, furando a decisão da D6.

> ⚠ **`afterSignOutUrl` é opção do `<ClerkProvider>` no Core 3**, não prop do
> `<UserButton />` — `UserButtonProps` não a declara e `ClerkOptions` sim
> (`node_modules/@clerk/shared/dist/types/`). No botão ela **compila e não faz
> nada**, que é o pior tipo de erro: sem aviso do compilador. A checagem que
> pega isso é procurar o valor na configuração que o Clerk publica na página —
> `curl` na rota e `grep afterSignOutUrl`.

> ⚠ **Pasta de rota começando com `_` não vira rota.** O App Router trata
> `_nome` como pasta privada. Isso já custou tempo duas vezes (C1 e D4): o
> teste "passa" porque a rota nunca existiu.
