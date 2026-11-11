import "server-only";
import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import {
  comoIdDeWebhookVerificado,
  salvarUsuario,
  type ResultadoSalvar,
} from "@/features/autenticacao/salvar-usuario";

/**
 * Regra de negócio da sincronização Clerk → Postgres (tarefa D4).
 *
 * Separado do route handler de propósito: assim dá para testar sem forjar
 * uma requisição assinada.
 *
 * A **gravação** em si não mora aqui — mora em `salvar-usuario`, compartilhada
 * com a garantia de primeira requisição (D5). O que é exclusivo deste arquivo
 * é ler o formato do evento do Clerk e decidir o que cada tipo significa.
 */
export type ResultadoSincronizacao =
  ResultadoSalvar | "removido" | "ignorado_evento";

declare const marcaVerificado: unique symbol;

/**
 * Prova em **tipo** de que o payload já passou por `verifyWebhook`.
 *
 * ⚠ A revisão de arquitetura (rodada 12) flagrou que `sincronizarUsuario`
 * aceitava `(tipo: string, data: unknown)` — exportada, sem checar
 * assinatura, confiando inteiramente em que o chamador (o route handler) já
 * tinha verificado. Nada no sistema de tipos impedia uma Server Action, rota
 * de debug ou teste futuro de chamá-la direto com JSON vindo do cliente:
 * `{tipo: "user.deleted", data: {id: "<qualquer-id>"}}` apagaria (soft-delete)
 * qualquer usuário — um IDOR via bypass da verificação do webhook, não via
 * sessão. Só `verificarWebhookDoClerk` produz este tipo.
 */
export type EventoClerkVerificado = {
  tipo: string;
  dados: unknown;
  readonly [marcaVerificado]: true;
};

/** Verifica a assinatura e devolve o evento já marcado como confiável. */
export async function verificarWebhookDoClerk(
  req: NextRequest,
): Promise<EventoClerkVerificado> {
  const evento = await verifyWebhook(req);
  return { tipo: evento.type, dados: evento.data } as EventoClerkVerificado;
}

/** O que `extrairDados` consegue ler do payload, antes de ir para o banco. */
type DadosBrutos = { id: string; email: string | null; nome: string | null };

/** Extrai o que interessa do payload do Clerk, sem confiar no formato. */
export function extrairDados(data: unknown): DadosBrutos | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  if (typeof d.id !== "string" || !d.id) return null;

  const emails = Array.isArray(d.email_addresses) ? d.email_addresses : [];
  const principal =
    emails.find(
      (e) =>
        typeof e === "object" &&
        e !== null &&
        (e as Record<string, unknown>).id === d.primary_email_address_id,
    ) ?? emails[0];

  const email =
    typeof principal === "object" && principal !== null
      ? (((principal as Record<string, unknown>).email_address as string) ??
        null)
      : null;

  const nome =
    [d.first_name, d.last_name]
      .filter((p): p is string => typeof p === "string" && p.length > 0)
      .join(" ") || null;

  return { id: d.id, email: email ?? null, nome };
}

export async function sincronizarUsuario(
  evento: EventoClerkVerificado,
): Promise<ResultadoSincronizacao> {
  const dados = extrairDados(evento.dados);
  if (!dados) return "ignorado_evento";

  // Remoção **lógica**: apagar a linha levaria junto meses de histórico
  // financeiro. O usuário some do app, os dados dele não somem do banco.
  if (evento.tipo === "user.deleted") {
    await getDb()
      .update(users)
      .set({ removidoEm: new Date(), atualizadoEm: new Date() })
      .where(eq(users.id, dados.id));
    return "removido";
  }

  if (evento.tipo !== "user.created" && evento.tipo !== "user.updated") {
    return "ignorado_evento";
  }

  const { resultado } = await salvarUsuario({
    id: comoIdDeWebhookVerificado(dados.id),
    email: dados.email,
    nome: dados.nome,
  });
  return resultado;
}
