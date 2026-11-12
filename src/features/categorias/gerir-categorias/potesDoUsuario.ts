import "server-only";
import { asc, eq } from "drizzle-orm";
import { buckets } from "@/db/schema";
import { getDb } from "@/lib/db";
import type { PoteNaGestao } from "./categoriasNaTela";

/**
 * Os potes do usuário, na ordem da tela, no formato de `PoteNaGestao`.
 *
 * Estava copiado em `listarParaGerir` e em `listarPendentes`, a segunda cópia
 * com um comentário admitindo carregar a meta "só para caber no tipo". Um pote
 * tem meta; uma consulta só garante que as duas telas leem o mesmo pote.
 *
 * ⚠ **Da tabela de potes, e não derivados das categorias**: derivar faria o
 * pote sem nenhuma categoria sumir — exatamente da tela onde daria para criar
 * uma dentro dele.
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora.
 */
export function potesDoUsuario(userId: string): Promise<PoteNaGestao[]> {
  return getDb()
    .select({
      id: buckets.id,
      slug: buckets.slug,
      nome: buckets.nome,
      emoji: buckets.emoji,
      cor: buckets.cor,
      tipo: buckets.tipo,
      percentual: buckets.percentualMeta,
      ordem: buckets.ordem,
    })
    .from(buckets)
    .where(eq(buckets.userId, userId))
    .orderBy(asc(buckets.ordem));
}
