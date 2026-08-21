import "server-only";
import { and, eq } from "drizzle-orm";
import { categories, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import type { FonteDeSugestao } from "@/features/classificacao/motor/sugestoes";

/**
 * Gravar a decisão da revisão (tarefa D4).
 *
 * ⚠ **O `userId` vem da sessão; o id do lançamento vem do cliente.** Por isso
 * ele entra no `where` **junto** com o `user_id`, nunca sozinho — mesma regra
 * do desfazer da spec 02. Sem isso, um id adivinhado mexeria no lançamento de
 * outra conta.
 */

export type Decisao =
  | {
      tipo: "categoria";
      lancamentoId: string;
      categoriaId: string;
      /** De onde veio a escolha, para a procedência da C3. */
      fonte: "sugestao" | "manual";
      fonteDaSugestao?: FonteDeSugestao;
    }
  | { tipo: "fora-do-calculo"; lancamentoId: string }
  /** O valor alto que uma regra classificou: você confirmou que está certo. */
  | { tipo: "confirmar"; lancamentoId: string };

export type ResultadoDaDecisao = { ok: true } | { ok: false; erro: string };

/**
 * A mesma mensagem para "não existe" e "não é seu".
 *
 * Respostas diferentes contariam quais ids existem no banco — a mesma razão da
 * D5 da spec 02.
 */
const NAO_ENCONTRADO =
  "Esse lançamento não está mais esperando decisão. Recarregue a tela.";

const MOTIVO_EXCLUIDO = "você marcou como fora do cálculo";

export async function decidirLancamento(
  userId: string,
  decisao: Decisao,
): Promise<ResultadoDaDecisao> {
  const db = getDb();

  if (decisao.tipo === "categoria") {
    /*
     * ⚠ A categoria **também** vem do cliente, e precisa ser conferida.
     *
     * Sem isto, um id de categoria de outra conta entraria em
     * `transactions.categoria_id` — o `user_id` no where protege o lançamento,
     * mas não o destino dele. O vazamento seria de leitura: o painel de outra
     * pessoa passaria a somar um gasto que não é dela.
     */
    const [categoria] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, decisao.categoriaId),
          eq(categories.userId, userId),
        ),
      )
      .limit(1);

    if (!categoria) return { ok: false, erro: NAO_ENCONTRADO };
  }

  const agora = new Date();

  const alteracao =
    decisao.tipo === "categoria"
      ? {
          categoriaId: decisao.categoriaId,
          classificadoPor: decisao.fonte,
          // A procedência da sugestão só existe quando a escolha veio de uma
          // (`transactions_fonte_sugestao_ck`).
          fonteDaSugestao:
            decisao.fonte === "sugestao" ? (decisao.fonteDaSugestao ?? null) : null,
          classificadoEm: agora,
          // Escolher resolve a pendência: o aviso de valor alto ou de par que
          // se anula deixa de valer, porque você acabou de olhar.
          status: "importado" as const,
          motivo: null,
        }
      : decisao.tipo === "fora-do-calculo"
        ? {
            status: "excluido" as const,
            motivo: MOTIVO_EXCLUIDO,
            classificadoEm: agora,
          }
        : {
            // Confirmar mantém tudo o que a regra gravou — categoria, regra e
            // chave congelada. Só o pedido de conferência sai.
            status: "importado" as const,
            motivo: null,
            classificadoEm: agora,
          };

  const alterados = await db
    .update(transactions)
    .set(alteracao)
    .where(
      and(
        eq(transactions.id, decisao.lancamentoId),
        eq(transactions.userId, userId),
      ),
    )
    .returning({ id: transactions.id });

  return alterados.length > 0
    ? { ok: true }
    : { ok: false, erro: NAO_ENCONTRADO };
}
