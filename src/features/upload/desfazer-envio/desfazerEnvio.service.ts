import "server-only";
import { and, eq } from "drizzle-orm";
import { imports, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import {
  recusaDoImportId,
  resultadoDoDesfazer,
  type ResultadoDesfazer,
} from "./respostaDoDesfazer";

/**
 * Desfazer uma importação (tarefa D5).
 *
 * ⚠ O `importId` **vem do cliente** — é o único caminho possível, já que a
 * tela precisa dizer qual envio. Por isso ele é tratado como palpite: o
 * `userId` da sessão entra no `where` de toda consulta daqui, e é o banco que
 * garante que um id de outra pessoa não apaga nada
 * (`references/architecture.md`, Thin Client / Fat Server).
 */

export type { ResultadoDesfazer };

/*
 * Envio inexistente, envio de outro dono e id malformado devolvem **a mesma**
 * frase — ver `respostaDoDesfazer.ts`, onde ela está sob teste.
 */
export async function desfazerImportacao(
  userId: string,
  importId: string,
): Promise<ResultadoDesfazer> {
  const recusa = recusaDoImportId(importId);
  if (recusa) return recusa;

  return getDb().transaction(async (tx) => {
    /**
     * A conferência de dono vem **antes** de qualquer deleção.
     *
     * A ordem inversa — apagar e depois descobrir que não era seu — exigiria
     * desfazer a transação no meio, e `tx.rollback()` do Drizzle funciona
     * lançando um erro. Perguntar primeiro é mais simples e não depende de
     * exceção para estar correto.
     */
    const [envio] = await tx
      .select({ nomeArquivo: imports.nomeArquivo })
      .from(imports)
      .where(and(eq(imports.id, importId), eq(imports.userId, userId)))
      .limit(1);

    if (!envio) return resultadoDoDesfazer(undefined, 0);

    /**
     * Apago os lançamentos **explicitamente** em vez de deixar o
     * `on delete cascade` fazer.
     *
     * Não é desconfiança do cascade — ele continua no schema como rede. É que
     * o `returning` me dá o número do que de fato saiu; a alternativa seria
     * mostrar o `lancamentos_importados` congelado no envio, ou seja, o que
     * eu *esperava* apagar.
     */
    const apagados = await tx
      .delete(transactions)
      .where(
        and(
          eq(transactions.importId, importId),
          eq(transactions.userId, userId),
        ),
      )
      .returning({ id: transactions.id });

    await tx
      .delete(imports)
      .where(and(eq(imports.id, importId), eq(imports.userId, userId)));

    return resultadoDoDesfazer(envio, apagados.length);
  });
}
