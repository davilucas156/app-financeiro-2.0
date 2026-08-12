# Plano — C3 · Tabelas `buckets` e `categories`

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** C3 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** BANCO
**Depende de:** C2 (concluída, commit `358ba38`)

## Reuso identificado

- `src/features/onboarding/potes-padrao.ts` (B3) é o que vai popular estas
  tabelas na D7. O schema é desenhado **para caber nele sem conversão**:
  cada campo do módulo tem coluna correspondente.
- `src/db/schema.ts` e o pipeline de migration da C1/C2.

## Arquivos a modificar

- `src/db/schema.ts` — `buckets` e `categories`.
- `references/architecture.md` — registrar as tabelas e as duas decisões
  abaixo.

## Arquivos gerados

- `src/db/migrations/0001_*.sql` + snapshot.

## Decisão 1: `user_id` também em `categories`

Uma categoria pertence a um pote, e o pote pertence a um usuário. Pela
normalização, `categories` não precisaria de `user_id` — bastaria seguir a
`bucket_id`.

Vou **desnormalizar mesmo assim**, e o motivo é segurança, não conveniência.

Este projeto não tem RLS: o isolamento por usuário é manual, e a regra do
`architecture.md` é "toda query filtra por `user_id` da sessão". Se
`categories` não tiver `user_id`, essa regra vira impossível de seguir
literalmente — cada consulta precisaria de um `join` só para provar posse, e
qualquer esquecimento vira vazamento entre contas a partir de um `bucket_id`
vindo do cliente.

Com a coluna, a regra continua aplicável em toda tabela, sem exceção. O custo
é manter os dois campos coerentes na escrita, que acontece num lugar só (D7).

## Decisão 2: `slug` além de `nome`

O critério pede restrição impedindo dois potes de mesmo nome para o mesmo
usuário — e ela entra. Mas a **idempotência do onboarding** (D7: duplo toque
não pode criar 16 potes) não deve depender do nome: na fase 2 o usuário poderá
renomear os potes, e aí o seed deixaria de se reconhecer.

Então cada pote e cada categoria carregam um `slug` estável, e a idempotência
usa ele. Duas restrições, dois propósitos:

- `(user_id, nome)` único → não existir dois potes com o mesmo rótulo na tela
- `(user_id, slug)` único → o seed reconhecer o que já criou, mesmo renomeado

## Colunas — `buckets`

| Coluna | Tipo | Nulo? | Nota |
|---|---|---|---|
| `id` | `uuid` PK | não | `defaultRandom()` |
| `user_id` | `text` FK → `users.id` | não | `on delete cascade` |
| `slug` | `text` | não | identidade estável (`custos-fixos`) |
| `nome` | `text` | não | rótulo editável |
| `emoji` | `text` | não | |
| `cor` | `text` | não | hex do design system |
| `percentual_meta` | `integer` | **sim** | nulo nos dois potes fora do rateio |
| `valor_meta_centavos` | `integer` | **sim** | centavos, como todo dinheiro aqui |
| `observacao` | `text` | **sim** | "eventual" / "sem meta" — o que a tela mostra no lugar de "0%" |
| `ordem` | `integer` | não | ordem de exibição |
| `criado_em` / `atualizado_em` | `timestamptz` | não | |

**Percentual como inteiro.** O produto trabalha com percentuais cheios
(30/25/15/15/10/5). Se a fase 2 permitir 12,5%, será preciso uma migration de
tipo — registro isso como limitação consciente, não como descuido.

## Colunas — `categories`

| Coluna | Tipo | Nulo? | Nota |
|---|---|---|---|
| `id` | `uuid` PK | não | |
| `bucket_id` | `uuid` FK → `buckets.id` | não | `on delete cascade` |
| `user_id` | `text` FK → `users.id` | não | decisão 1 |
| `slug` | `text` | não | |
| `nome` | `text` | não | |
| `tag_visual` | `text` | **sim** | as tags do painel (`t-gas`, `t-fix`…) |
| `ordem` | `integer` | não | |
| `criado_em` | `timestamptz` | não | |

## Índices e restrições

- Índice em `buckets.user_id` e em `categories.user_id` — toda query filtra
  por eles.
- Índice em `categories.bucket_id`.
- Únicos: `(user_id, nome)` e `(user_id, slug)` em `buckets`;
  `(bucket_id, nome)` e `(bucket_id, slug)` em `categories`.

## Caminho feliz

1. Tabelas declaradas no schema.
2. `db:generate` — **leio o SQL antes de aplicar**.
3. `db:migrate` aplica.
4. Confiro no banco: colunas, tipos, FKs, índices e únicos.
5. Testo a restrição de unicidade e o cascade **com dados de teste, desfeitos
   por `ROLLBACK`** — não deixo lixo no banco.
6. `build`, `tsc --noEmit` e `lint` limpos.

## Edge cases

| Situação | Tratamento |
|---|---|
| Onboarding rodando duas vezes | O único `(user_id, slug)` faz a segunda inserção falhar em vez de duplicar. A D7 trata o conflito |
| Usuário apagado de verdade | `cascade` limpa potes e categorias. Não é o fluxo normal — o padrão é `removido_em` |
| Categoria apontando para pote de outro usuário | Possível no schema; **impedido na escrita** (D7 grava os dois campos juntos). Anotado |
| Pote sem percentual | Coluna nula, e `observacao` diz o motivo |
| Dinheiro em centavos | `integer` cobre até ~R$21 milhões |
| Renomear pote na fase 2 | `slug` não muda; o seed continua se reconhecendo |

## Erros

| Erro | Resposta |
|---|---|
| SQL gerado diferente do planejado | Paro e mostro antes de aplicar |
| Migration falhar no meio | O drizzle registra o que aplicou; reporto sem tentar remendar à mão |

## Thin Client / Fat Server

Nenhuma query aqui. A decisão 1 existe justamente para a regra de isolamento
continuar aplicável literalmente quando as queries existirem (fase D).

## Fora do escopo

- Categorias padrão (os dados) → **C4**
- Gravação e idempotência → **D7**
- `classification_rules` → **C5**

## Critério de pronto (da Etapa 2)

- [ ] `buckets` e `categories` criadas com as colunas previstas
- [ ] FK e índice por `user_id`
- [ ] Restrição impedindo dois potes de mesmo nome para o mesmo usuário
