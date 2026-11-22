import "server-only";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getDb } from "@/lib/db";

/**
 * O nome do titular, para `ehTransferenciaPropria`.
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora.
 *
 * Mora aqui, e não nos dois serviços que o usam (painel e comparativo), para
 * que os dois leiam **o mesmo nome do mesmo lugar**: um painel e um comparativo
 * que discordassem sobre o que é transferência sua mostrariam dois totais
 * diferentes para o mesmo pote.
 *
 * `null` quando o Clerk não devolveu nome — e aí nada é reconhecido como
 * transferência própria, que é o comportamento de antes.
 */
export async function nomeDoTitular(userId: string): Promise<string | null> {
  const [linha] = await getDb()
    .select({ nome: users.nome })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return linha?.nome ?? null;
}
