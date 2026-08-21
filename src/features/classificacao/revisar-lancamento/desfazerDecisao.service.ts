import "server-only";
import { and, eq } from "drizzle-orm";
import { decisionUndo, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";

/**
 * Desfazer a última decisão da revisão (tarefa D6).
 *
 * ## Não recebe id nenhum, e isso é a proteção
 *
 * O cliente não diz **o que** desfazer — ele só pede "desfaça". Qual lançamento
 * volta sai da linha que o próprio servidor gravou em `decision_undo`, sob o
 * `user_id` da sessão. Não há id do navegador para conferir porque não há id do
 * navegador.
 *
 * ## Desfazer reabre um lançamento, não a cascata
 *
 * Se aquela decisão criou regra, a regra **fica**, e os irmãos que ela pegou
 * seguem classificados. É o que a tarefa manda: desfazer uma classificação não
 * é desfazer o aprendizado, e apagar a regra em silêncio seria pior surpresa.
 *
 * A tela avisa isso **antes** — ver `avisoDoVoltar` em `desfazer.ts`.
 *
 * ## Não existe refazer
 *
 * A linha do desfazer é apagada junto. Um botão que desfaz duas vezes o mesmo
 * passo — ou que ressuscita um passo já desfeito — seria pior do que um botão
 * que desfaz uma vez e apaga.
 */

export type ResultadoDoDesfazer =
  | { ok: true; descricao: string }
  | { ok: false; erro: string };

const NADA_PARA_DESFAZER =
  "Não há nada para desfazer. Recarregue a tela se ela parecer atrasada.";

export async function desfazerDecisao(
  userId: string,
): Promise<ResultadoDoDesfazer> {
  const db = getDb();

  return db.transaction(async (tx) => {
    /*
     * `for update` porque dois toques quase simultâneos no celular acontecem.
     * Sem o lock, os dois leriam a mesma sombra e o segundo restauraria por
     * cima de um lançamento que já tinha voltado — parecendo inofensivo, e não
     * sendo: entre um e outro pode ter havido uma decisão nova.
     */
    const [sombra] = await tx
      .select()
      .from(decisionUndo)
      .where(eq(decisionUndo.userId, userId))
      .for("update")
      .limit(1);

    if (!sombra) return { ok: false, erro: NADA_PARA_DESFAZER };

    const volta = restaurar(sombra);

    const [voltou] = await tx
      .update(transactions)
      .set(volta)
      .where(
        and(
          eq(transactions.id, sombra.transactionId),
          eq(transactions.userId, userId),
        ),
      )
      .returning({ descricao: transactions.descricaoOriginal });

    // Sai **de qualquer jeito**, inclusive se o update não achou nada. Sombra
    // pendurada em lançamento que não existe mais deixaria o botão aceso
    // prometendo desfazer o que não dá.
    await tx.delete(decisionUndo).where(eq(decisionUndo.userId, userId));

    if (!voltou) return { ok: false, erro: NADA_PARA_DESFAZER };

    return { ok: true, descricao: voltou.descricao };
  });
}

/**
 * As oito colunas de volta — com uma guarda.
 *
 * ⚠ **Se a categoria da sombra foi apagada entre decidir e desfazer**, o
 * `on delete set null` da `decision_undo` já a zerou, e restaurar
 * `classificado_por = 'manual'` com `categoria_id` nulo bateria no
 * `transactions_classificacao_ck`.
 *
 * Nesse caso o lançamento volta como **pendente limpo**, e é honesto: a
 * categoria não existe mais, não há para onde voltar. Reinventar uma seria
 * pior do que pedir a decisão de novo.
 */
function restaurar(sombra: typeof decisionUndo.$inferSelect) {
  if (sombra.categoriaId === null) {
    return {
      categoriaId: null,
      classificadoPor: null,
      regraId: null,
      regraChave: null,
      fonteDaSugestao: null,
      classificadoEm: null,
      status: sombra.status,
      motivo: sombra.motivo,
    };
  }

  return {
    categoriaId: sombra.categoriaId,
    classificadoPor: sombra.classificadoPor,
    regraId: sombra.regraId,
    regraChave: sombra.regraChave,
    fonteDaSugestao: sombra.fonteDaSugestao,
    classificadoEm: sombra.classificadoEm,
    status: sombra.status,
    motivo: sombra.motivo,
  };
}
