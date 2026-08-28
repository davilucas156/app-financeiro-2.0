import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import {
  salvarUsuario,
  type DadosUsuario,
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

/** Extrai o que interessa do payload do Clerk, sem confiar no formato. */
export function extrairDados(data: unknown): DadosUsuario | null {
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
  tipo: string,
  data: unknown,
): Promise<ResultadoSincronizacao> {
  const dados = extrairDados(data);
  if (!dados) return "ignorado_evento";

  // Remoção **lógica**: apagar a linha levaria junto meses de histórico
  // financeiro. O usuário some do app, os dados dele não somem do banco.
  if (tipo === "user.deleted") {
    await getDb()
      .update(users)
      .set({ removidoEm: new Date(), atualizadoEm: new Date() })
      .where(eq(users.id, dados.id));
    return "removido";
  }

  if (tipo !== "user.created" && tipo !== "user.updated") {
    return "ignorado_evento";
  }

  const { resultado } = await salvarUsuario(dados);
  return resultado;
}
