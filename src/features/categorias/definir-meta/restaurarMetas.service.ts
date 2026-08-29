import "server-only";
import { and, eq } from "drizzle-orm";
import { buckets } from "@/db/schema";
import { getDb } from "@/lib/db";
import { METAS_DO_PADRAO } from "./metasDoPadrao";

/**
 * Devolver o rateio de fábrica (tarefa D1).
 *
 * ## Uma transação, e não oito escritas soltas
 *
 * São oito `update`s — um por pote de gasto. Soltos, uma falha no meio deixaria
 * metade do rateio restaurado e metade não: um estado que ninguém pediu, que
 * não é nem o antigo nem o novo, e que a tela mostraria como se fosse escolha
 * da pessoa.
 *
 * ⚠ **É o mesmo motivo pelo qual o onboarding grava em transação** (spec 01,
 * D7), e o mesmo motivo pelo qual o driver do Neon é o de WebSocket e não o
 * HTTP: o HTTP não tem transação interativa.
 *
 * ## O que ela não toca
 *
 * Pote que não está na semente fica como está — a semente não tem opinião
 * sobre ele. O `where` por slug garante isso sem precisar de uma lista de
 * exceções.
 */

export type ResultadoDaRestauracao =
  { ok: true; potes: number } | { ok: false; erro: string };

export async function restaurarMetasDoPadrao(
  userId: string,
): Promise<ResultadoDaRestauracao> {
  const potes = await getDb().transaction(async (tx) => {
    let alterados = 0;

    for (const meta of METAS_DO_PADRAO) {
      const linhas = await tx
        .update(buckets)
        .set({ percentualMeta: meta.percentual })
        .where(
          and(
            eq(buckets.userId, userId),
            eq(buckets.slug, meta.slug),
            // A mesma cláusula da escrita avulsa: a regra vale igual quando
            // quem escreve é o app.
            eq(buckets.tipo, "gasto"),
          ),
        )
        .returning({ id: buckets.id });

      alterados += linhas.length;
    }

    return alterados;
  });

  /*
   * ⚠ **Zero potes não é erro, é conta vazia.** Quem nunca concluiu o
   * onboarding não tem pote nenhum para restaurar, e dizer "deu errado" seria
   * mentira. A tela distingue pela contagem.
   */
  return { ok: true, potes };
}
