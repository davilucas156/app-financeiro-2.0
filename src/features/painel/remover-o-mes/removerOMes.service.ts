import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { imports, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";

/**
 * Apagar os envios que formaram um mês (tarefa C1).
 *
 * ## Remover o mês é remover os envios, e não só as linhas dele
 *
 * A Descoberta 4 da spec 14: `imports` tem `unique(user_id, hash)`, e a
 * importação recusa hash conhecido antes de gravar. Apagar os lançamentos e
 * deixar a linha de `imports` viva trancaria o reenvio do arquivo corrigido —
 * que é literalmente a próxima coisa que se quer fazer depois de tirar um mês
 * errado. O botão de remover viraria uma armadilha.
 *
 * ## Ela não lê e depois apaga: apaga com a pergunta dentro
 *
 * ⚠ Entre um `select` de "quais envios formaram o mês" e a transação que os
 * apaga cabe um envio novo — outra aba na `/upload`, um envio em voo. Sobraria
 * **meio mês**: nem o antigo nem o novo, e a tela o mostraria como se fosse
 * escolha da pessoa.
 *
 * A subconsulta dentro do `delete` fecha essa janela: o Postgres a avalia
 * contra o instantâneo do início do comando, e os `import_id` que voltam são
 * exatamente os envios a apagar em seguida — não uma segunda opinião sobre
 * quais eram.
 *
 * ## Por que não há conferência de dono, ao contrário do arquivo ao lado
 *
 * O `desfazerImportacao` pergunta o dono antes de apagar, e precisa: ele recebe
 * um `importId`, que é uma alça global — sem perguntar, um id alheio entraria
 * no `delete`.
 *
 * ⚠ **Aqui a entrada é um mês, que não é alça de nada.** `"2026-06"` só vira
 * linha depois de cruzar com o `user_id`, e ele vem de `garantirUsuario()`. O
 * mês de outra pessoa não casa: a subconsulta volta vazia e nada é apagado. Uma
 * consulta de dono não protegeria nada e daria a impressão de que protege.
 */

export type ResultadoDaRemocao =
  | { ok: true; envios: number; lancamentos: number }
  | { ok: false; erro: string };

/**
 * Mês inexistente, mês de outra pessoa e mês mal formado dizem **o mesmo**. Se
 * a resposta os diferenciasse, ela viraria um jeito de descobrir o que existe.
 */
const NAO_ENCONTRADO = "Esse mês não está mais aqui. A tela foi atualizada.";

/** A mesma forma do `check` de `mes_referencia` no schema. */
const MES = /^\d{4}-\d{2}$/;

export async function removerOMes(
  userId: string,
  mes: string,
): Promise<ResultadoDaRemocao> {
  // Recusa antes de tocar no banco: o que nunca existiria não vira consulta.
  if (!MES.test(mes)) return { ok: false, erro: NAO_ENCONTRADO };

  const db = getDb();

  return db.transaction(async (tx) => {
    const doMes = tx
      .select({ importId: transactions.importId })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.mesReferencia, mes),
        ),
      );

    /*
     * ⚠ **Os lançamentos saem explicitamente, e não pelo `on delete cascade`.**
     * Não é desconfiança do cascade — ele fica no schema como rede. É que o
     * `returning` é o que dá o número do que **de fato** saiu, e é dele que sai
     * a lista de envios a apagar em seguida. Mesma escolha do
     * `desfazerImportacao`, pelo mesmo motivo.
     */
    const apagados = await tx
      .delete(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          inArray(transactions.importId, doMes),
        ),
      )
      .returning({ importId: transactions.importId });

    /*
     * ⚠ **Zero não é erro, é mês que já saiu** — ou palpite de URL. Quem
     * transforma isso em recusa é a action; aqui seria mentira chamar de falha.
     * A saída antecipada existe porque `inArray` com lista vazia não é um
     * `delete` que se queira mandar.
     */
    if (apagados.length === 0) return { ok: true, envios: 0, lancamentos: 0 };

    const ids = [...new Set(apagados.map((linha) => linha.importId))];

    const envios = await tx
      .delete(imports)
      .where(and(eq(imports.userId, userId), inArray(imports.id, ids)))
      .returning({ id: imports.id });

    return { ok: true, envios: envios.length, lancamentos: apagados.length };
  });
}
