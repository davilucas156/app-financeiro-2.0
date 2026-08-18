# Plano — D4 · Webhook Clerk → Postgres

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D4 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** BACK
**Spec:** `specs/01-fundacao-e-acesso.md`, "Sincronizar usuário Clerk → Postgres"
**Depende de:** D3 (commit `371323d`) e da fase C

## Reuso identificado

- `getDb()` e o schema `users` (C1/C2).
- `estaConvidado()` da D3 — o webhook usa **o mesmo portão** da allowlist. É
  o que cumpre a promessa "quem não é convidado não ganha linha em `users`".
- `verifyWebhook` do próprio `@clerk/nextjs/webhooks`: verifica a assinatura
  Svix e usa `CLERK_WEBHOOK_SIGNING_SECRET` sozinho. Não escrevo verificação
  de assinatura à mão — criptografia caseira é como se erra nisso.

## Arquivos a criar

- `src/app/api/webhooks/clerk/route.ts` — o handler.
- `src/features/autenticacao/sincronizar-usuario/sincronizarUsuario.service.ts`
  — a regra de negócio: decide o que gravar para cada evento. Separado do
  handler para ser testável sem forjar uma requisição assinada.

## Arquivos a modificar

- `.env.example` já tem `CLERK_WEBHOOK_SIGNING_SECRET`.
- `references/architecture.md`.

## Eventos tratados

| Evento | Ação |
|---|---|
| `user.created` | Insere em `users` — **só se o e-mail estiver na allowlist** |
| `user.updated` | Atualiza nome/e-mail. Se deixou de ser convidado, não recria |
| `user.deleted` | Marca `removido_em`. **Não apaga a linha** — apagar levaria junto meses de histórico financeiro |
| qualquer outro | Ignora e responde 200, para o Clerk não reenviar |

## Idempotência

O Clerk reenvia webhooks quando não recebe 200 rápido. Entrega duplicada não
pode criar duas linhas — a gravação usa `on conflict (id) do update`, então
reprocessar o mesmo evento converge para o mesmo estado em vez de duplicar.

## Por que responder 200 mesmo ao ignorar

Responder erro faz o Clerk reenviar em backoff por horas. Para evento que não
nos interessa, isso é ruído. Só a **assinatura inválida** merece erro — e aí é
401, porque é exatamente o caso em que alguém está tentando forjar.

## Caminho feliz

1. Clerk envia `user.created` assinado.
2. `verifyWebhook` confirma a assinatura.
3. E-mail está na allowlist → linha criada em `users`.
4. Responde 200.

## Edge cases

| Situação | Tratamento |
|---|---|
| Assinatura inválida ou ausente | **401**, sem tocar no banco |
| `CLERK_WEBHOOK_SIGNING_SECRET` ausente | `verifyWebhook` falha → 401. Não há caminho que grave sem verificar |
| Entrega duplicada | `on conflict do update` |
| Usuário não convidado | Nenhuma linha criada. Responde 200 (não é erro do Clerk) |
| Conta sem e-mail primário | Tratado como não convidado |
| `user.deleted` de alguém que nunca existiu aqui | Nada a marcar; responde 200 |
| `user.updated` de alguém sem linha | `on conflict` cobre: insere |
| Evento fora de ordem (deleted antes de created) | O `removido_em` não é revertido por um `created` atrasado — o insert só preenche o que falta |

## Erros

| Erro | Resposta |
|---|---|
| Banco indisponível | **500**, para o Clerk reenviar. É o único caso em que reenvio ajuda |
| Payload sem os campos esperados | 200 sem gravar, e registro no log. Não vale derrubar o endpoint por um evento estranho |

## Thin Client / Fat Server

Endpoint de servidor puro. Nenhum dado sensível volta na resposta — o corpo é
só um `ok`, para não vazar se um e-mail está ou não na allowlist a quem
conseguir forjar uma requisição.

## O que fica bloqueado

O Clerk precisa de uma **URL pública** para entregar webhook, e do segredo de
assinatura configurado. Enquanto o endpoint não estiver no ar em produção com
`CLERK_WEBHOOK_SIGNING_SECRET`, não dá para verificar entrega real.

Verifico o que dá sem isso: assinatura inválida devolvendo 401, e a regra de
negócio testada direto, sem passar por requisição assinada.

## Fora do escopo

- Garantir usuário na primeira requisição (rede de segurança se o webhook
  falhar) → **D5**
- Criar potes → **D7**

## Critério de pronto (da Etapa 2)

- [ ] Trata `user.created` / `updated` / `deleted`
- [ ] Assinatura inválida responde 401 sem gravar
- [ ] Entrega duplicada não cria linha duplicada
- [ ] `deleted` faz remoção lógica
