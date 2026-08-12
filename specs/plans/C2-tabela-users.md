# Plano — C2 · Tabela `users`

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** C2 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** BANCO
**Depende de:** C1 (destravada — `DATABASE_URL` presente)

## Estado do ambiente

- Banco **Neon** na região São Paulo, conectado ao projeto `app-financeiro`
- `DATABASE_URL` (pooled) e `DATABASE_URL_UNPOOLED` (direta) nos três ambientes
- Variáveis do Supabase removidas (16), sem resíduo

Esta tarefa também **fecha a C1**: aplicar a primeira migration é o que prova
que o banco está provisionado e a ferramenta roda de ponta a ponta.

## Reuso identificado

- `src/db/schema.ts` e o `drizzle.config.ts` da C1. Nenhuma dependência nova.

## Arquivos a modificar

- `src/db/schema.ts` — a tabela `users`.
- `references/architecture.md` — registrar a tabela e a política de migrations.

## Arquivos gerados

- `src/db/migrations/0000_*.sql` — SQL da criação, versionado.
- `src/db/migrations/meta/*` — metadados do drizzle-kit.

## Colunas

| Coluna | Tipo | Nulo? | Por quê |
|---|---|---|---|
| `id` | `text` PK | não | **É o `user.id` do Clerk** (`user_2ab…`), não um serial nosso. Ter duas identidades para a mesma pessoa é fonte garantida de bug |
| `email` | `text` único | não | Chave natural e o que a allowlist compara |
| `nome` | `text` | **sim** | O perfil do Google pode não ter nome — a tela `/bem-vindo` já trata isso caindo em "Olá!" |
| `criado_em` | `timestamptz` | não | `defaultNow()` |
| `atualizado_em` | `timestamptz` | não | `defaultNow()`; o webhook `user.updated` (D4) atualiza |
| `onboarding_concluido_em` | `timestamptz` | **sim** | Nulo = onboarding pendente. É o que a D6 lê para decidir entre `/bem-vindo` e `/dashboard` |
| `removido_em` | `timestamptz` | **sim** | Remoção lógica. O webhook `user.deleted` marca aqui em vez de apagar — apagar levaria junto meses de histórico financeiro |

**`timestamptz` e não `timestamp`.** Sem fuso, um registro feito às 23h em São
Paulo e lido de outro fuso vira outro dia — e "mês de referência" é o eixo do
produto inteiro.

## Sobre "migration reversível"

O critério da Etapa 2 pede migration "aplicada e **reversível**". Preciso
corrigir a expectativa: **o drizzle-kit gera migrations apenas para frente.**
Não existe arquivo de *down*, nem no Drizzle nem no Prisma — é o padrão atual.

Reverter significa escrever uma migration nova que desfaz. Para esta em
específico o inverso é trivial (`DROP TABLE users`), e o `.sql` gerado é
legível, então dá para saber exatamente o que foi feito.

Vou registrar essa política no `architecture.md` em vez de fingir que o
critério foi cumprido como escrito.

## Caminho feliz

1. Tabela declarada em `schema.ts`.
2. `npm run db:generate` produz o `.sql` — **leio o SQL antes de aplicar**.
3. `npm run db:migrate` aplica no Neon.
4. Confirmo no banco que a tabela e as colunas existem com os tipos certos.
5. `build`, `tsc --noEmit` e `lint` limpos.

## Edge cases

| Situação | Tratamento |
|---|---|
| Dois usuários com o mesmo e-mail | Restrição de unicidade no banco, não só na aplicação |
| Usuário removido e recriado no Clerk | `id` novo do Clerk; a linha antiga fica com `removido_em`. O e-mail único conflitaria — **anotado para a D4 decidir**, não resolvido aqui |
| Nome ausente | Coluna nula por contrato, não string vazia |
| Migration rodando duas vezes | O drizzle-kit mantém registro do que já aplicou |
| Migration pelo pooler | Config usa a `DATABASE_URL_UNPOOLED` |

## Erros

| Erro | Resposta |
|---|---|
| Conexão recusada | Reporto a mensagem sem mexer em credencial |
| SQL gerado diferente do esperado | Paro e mostro o `.sql` antes de aplicar — é banco, não tem desfazer fácil |

## Thin Client / Fat Server

Nenhuma query nesta tarefa. Quando existirem (fase D), toda leitura e escrita
em `users` filtra por `id` vindo de `auth()` no servidor — **nunca** por
identificador vindo do cliente.

## Fora do escopo

- `buckets` e `categories` → **C3**
- Webhook que popula a tabela → **D4**
- Garantia de usuário na primeira requisição → **D5**

## Critério de pronto (da Etapa 2)

- [ ] Tabela com id do Clerk como PK, nome, email único, `criado_em`,
      `onboarding_concluido_em` nullable e coluna de remoção lógica
- [ ] Migration aplicada
- [ ] ~~Reversível~~ → substituído por política de migrations só para frente,
      documentada
