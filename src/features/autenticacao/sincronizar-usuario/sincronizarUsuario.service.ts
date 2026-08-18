import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { estaConvidado } from "@/features/autenticacao/allowlist";

/**
 * Regra de negócio da sincronização Clerk → Postgres (tarefa D4).
 *
 * Separado do route handler de propósito: assim dá para testar sem forjar
 * uma requisição assinada.
 */
export type ResultadoSincronizacao =
  | "criado"
  | "atualizado"
  | "removido"
  | "ignorado_nao_convidado"
  | "ignorado_sem_email"
  | "ignorado_evento";

type DadosUsuario = {
  id: string;
  email: string | null;
  nome: string | null;
};

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
      ? ((principal as Record<string, unknown>).email_address as string) ?? null
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

  const db = getDb();

  // Remoção **lógica**: apagar a linha levaria junto meses de histórico
  // financeiro. O usuário some do app, os dados dele não somem do banco.
  if (tipo === "user.deleted") {
    await db
      .update(users)
      .set({ removidoEm: new Date(), atualizadoEm: new Date() })
      .where(eq(users.id, dados.id));
    return "removido";
  }

  if (tipo !== "user.created" && tipo !== "user.updated") {
    return "ignorado_evento";
  }

  if (!dados.email) return "ignorado_sem_email";

  // **O mesmo portão da D3.** É isto que cumpre a promessa de que quem não
  // foi convidado não ganha linha em `users` — sem isso, qualquer pessoa que
  // autenticasse no Google viraria registro no nosso banco.
  if (!estaConvidado(dados.email)) return "ignorado_nao_convidado";

  // `on conflict do update`: o Clerk reenvia webhook quando não recebe 200
  // rápido, e entrega duplicada não pode virar linha duplicada.
  const [linha] = await db
    .insert(users)
    .values({ id: dados.id, email: dados.email, nome: dados.nome })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: dados.email,
        nome: dados.nome,
        atualizadoEm: new Date(),
      },
    })
    .returning({ criadoEm: users.criadoEm, atualizadoEm: users.atualizadoEm });

  const eraNovo =
    linha != null &&
    Math.abs(linha.atualizadoEm.getTime() - linha.criadoEm.getTime()) < 1000;

  return eraNovo ? "criado" : "atualizado";
}
