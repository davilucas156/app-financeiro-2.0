import type { NextRequest } from "next/server";
import {
  sincronizarUsuario,
  verificarWebhookDoClerk,
} from "@/features/autenticacao/sincronizar-usuario/sincronizarUsuario.service";

/**
 * Webhook do Clerk (tarefa D4).
 *
 * A verificação de assinatura é do próprio SDK (`verifyWebhook`, que usa
 * `CLERK_WEBHOOK_SIGNING_SECRET`), por dentro de `verificarWebhookDoClerk`.
 * Não escrevo isso à mão: verificação de assinatura caseira é exatamente onde
 * se erra.
 *
 * ⚠ **`sincronizarUsuario` só aceita `EventoClerkVerificado`** — o tipo que
 * só `verificarWebhookDoClerk` produz (rodada 12 da revisão de arquitetura).
 * Antes aceitava `(tipo: string, data: unknown)`, e qualquer código que a
 * importasse direto poderia soft-deletar um usuário sem passar por aqui.
 *
 * **Códigos de resposta são deliberados.** O Clerk reenvia em backoff por
 * horas quando não recebe 200, então:
 * - assinatura inválida → **401**, e nada toca o banco;
 * - evento que não nos interessa → **200**, para não gerar reenvio à toa;
 * - falha de banco → **500**, que é o único caso em que reenviar ajuda.
 *
 * O corpo da resposta é sempre genérico: não revela se um e-mail está ou não
 * na allowlist a quem conseguir disparar uma requisição.
 */
export async function POST(req: NextRequest) {
  let evento;

  try {
    evento = await verificarWebhookDoClerk(req);
  } catch {
    return Response.json({ erro: "assinatura invalida" }, { status: 401 });
  }

  try {
    const resultado = await sincronizarUsuario(evento);
    console.log(`[webhook clerk] ${evento.tipo} -> ${resultado}`);
    return Response.json({ ok: true });
  } catch (erro) {
    console.error("[webhook clerk] falha ao sincronizar", erro);
    // 500 de propósito: aqui reenviar resolve.
    return Response.json({ erro: "falha ao sincronizar" }, { status: 500 });
  }
}
