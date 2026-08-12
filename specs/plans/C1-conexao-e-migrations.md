# Plano — C1 · Conexão e migrations

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** C1 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** BANCO
**Depende de:** portão de aprovação visual da fase B (validado pelo Davi)

## Estado do ambiente

- Projeto vinculado à Vercel: `app-financeiro`
- Banco: **região São Paulo**, escolhida pelo Davi
- `.env.local` existe, mas contém apenas `VERCEL_OIDC_TOKEN` — **a
  `DATABASE_URL` ainda não está lá**. Ver "O que fica bloqueado".

## Decisão de ferramenta: Drizzle

| Camada | Escolha | Versão |
|---|---|---|
| ORM / query builder | `drizzle-orm` | 0.45 |
| Migrations | `drizzle-kit` | 0.31 |
| Driver | `@neondatabase/serverless` | 1.1 |
| Barreira de servidor | `server-only` | — |

**Por que Drizzle e não Prisma:** o Prisma carrega um binário de engine, que
pesa no cold start e no tamanho do bundle de função serverless. O Drizzle é
só TypeScript, e o schema em TS faz os tipos fluírem para as queries sem
geração de código intermediária. Para um app que roda inteiro em funções da
Vercel, isso importa.

**Por que as migrations do drizzle-kit:** ele gera **arquivos `.sql` legíveis**
e versionados, em vez de aplicar mudanças mágicas. Dá para ler o que vai rodar
antes de rodar — que é o que se espera de mudança de schema em banco com dados
financeiros.

## O detalhe do driver que decide o resultado da D7

A Neon oferece dois drivers, e a escolha errada aqui só apareceria lá na frente:

- **`neon-http`** — cada query é uma requisição HTTP. Simples e rápido, mas
  **não suporta transação interativa**. `db.transaction()` lança erro.
- **`neon-serverless`** (Pool, sobre WebSocket) — **suporta transação**.

A tarefa **D7 exige gravar os 8 potes e as categorias numa única transação**,
com a garantia de que uma falha não deixe a conta pela metade. Com
`neon-http`, essa garantia seria impossível e a D7 teria que ser reescrita.

Por isso o projeto usa **`neon-serverless`** desde o começo. É a escolha mais
cara em um detalhe (WebSocket em vez de HTTP) e a única compatível com o que
a spec já promete ao usuário.

## Arquivos a criar

- `drizzle.config.ts` — aponta o schema, a pasta de migrations e a
  `DATABASE_URL`.
- `src/lib/db.ts` — client único, **server-only**. Importa o pacote
  `server-only`, que faz o build **falhar** se algum componente de cliente
  tentar importar o banco. É a regra Thin Client / Fat Server virando erro de
  compilação, não recomendação.
- `src/db/schema.ts` — arquivo do schema, ainda **vazio de tabelas**. As
  tabelas são C2 (`users`) e C3 (`buckets`, `categories`). Existe aqui para o
  drizzle-kit ter alvo.
- `src/db/migrations/` — pasta dos `.sql` gerados (nasce com o primeiro
  `db:generate`, na C2).

## Arquivos a modificar

- `package.json` — scripts `db:generate`, `db:migrate` e `db:studio`; e as
  dependências novas.
- `src/db/.gitkeep` — removido, a pasta ganha conteúdo.
- `references/architecture.md` — registrar a stack de banco, o porquê do
  driver e os comandos.

## Onde os comandos ficam documentados

O critério da Etapa 2 dizia "comando de migration documentado no readme". Vou
documentar em **`references/architecture.md`**, não no `readme.md`: o readme é
o documento de requisitos do produto, escrito para descrever o que o app faz,
e não o lugar de instrução operacional. O `architecture.md` é o arquivo que o
Claude lê antes de agir — é onde a instrução tem efeito.

## Caminho feliz

1. Dependências instaladas.
2. `drizzle.config.ts`, `src/lib/db.ts` e `src/db/schema.ts` criados.
3. Scripts no `package.json`.
4. `build`, `tsc --noEmit` e `lint` limpos — **sem** precisar de banco.
5. Com a `DATABASE_URL` presente, `npm run db:migrate` roda contra o banco.

## O que fica bloqueado

Sem a `DATABASE_URL`, **estes dois itens do critério de pronto não podem ser
verificados**:

- "banco Postgres provisionado"
- "ferramenta de migration rodando"

O resto da tarefa é feito e verificado normalmente. Não vou fingir que a C1
está completa: ela fica **parcial**, e fecho assim que a credencial existir.
A C2 (tabela `users`) precisa da mesma credencial para aplicar a migration,
embora possa ser escrita antes.

## Edge cases

| Situação | Tratamento |
|---|---|
| `DATABASE_URL` ausente em tempo de execução | `db.ts` falha com mensagem explícita apontando o `vercel env pull`, em vez de erro obscuro de conexão |
| Componente de cliente importar `db.ts` | O pacote `server-only` quebra o build. É proposital |
| Várias instâncias do Pool em desenvolvimento | O client é criado uma vez por módulo e reaproveitado; o hot reload não abre pool novo a cada salvamento |
| `.env.local` no git | Já coberto pelo `.gitignore` |
| Região do banco diferente da das funções | Fora do meu alcance — é configuração de painel. Já avisado ao Davi |

## Erros

| Erro | Resposta |
|---|---|
| Instalação falhar por EPERM do OneDrive | Já aconteceu na A1: foi só no cleanup. Se travar de verdade, reporto |
| `db:migrate` recusar conexão | Reporto a mensagem, sem tentar contornar mexendo em credencial |

## Fora do escopo

- Tabelas → **C2** (`users`) e **C3** (`buckets`, `categories`)
- Queries de aplicação → fase D
- Seed → **D7**

## Critério de pronto (da Etapa 2)

- [ ] Banco Postgres provisionado — **bloqueado, falta `DATABASE_URL`**
- [x] Client server-only em `src/lib/db.ts`
- [ ] Ferramenta de migration escolhida e **rodando** — escolhida e
      configurada; "rodando" fica bloqueado
- [x] Comando de migration documentado
