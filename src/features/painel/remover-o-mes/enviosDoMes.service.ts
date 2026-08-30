import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { imports, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import type { LinhaDoEnvioPorMes } from "./oQueSaiDoMes";

/**
 * Quais envios formaram este mês, e quanto cada um leva (tarefa B2).
 *
 * ## ⚠ Esta é a única contagem do projeto que **não** filtra `excluido`
 *
 * Toda consulta que conta lançamento aqui carrega
 * `ne(transactions.status, "excluido")` — `somarOMes`, `historicoDosMeses`,
 * `coberturaDosMeses`, a contagem de meses do painel. Pagamento de fatura é
 * `excluido` desde a spec 02, e contá-lo faria o gasto do cartão aparecer duas
 * vezes.
 *
 * A pergunta daqui é outra. As outras perguntam *quanto foi gasto*; esta
 * pergunta *o que desaparece*. Um envio com 53 linhas das quais 5 são pagamento
 * de fatura some **inteiro**, com as 5 junto — e uma confirmação dizendo "48
 * lançamentos" estaria subestimando o estrago, que é o único erro que uma tela
 * de confirmação não pode cometer.
 *
 * Está escrito porque quem ler vai achar que é esquecimento.
 *
 * ## Cru de propósito
 *
 * Devolve linha por envio **e por mês** — é essa repetição que carrega o
 * transbordo. Quem junta consulta e regra é a action; um service que já
 * devolvesse o objeto da tela seria um service impossível de testar sem banco,
 * e o `oQueSaiDoMes` existe justamente para ser testável.
 */
export async function enviosDoMes(
  userId: string,
  mes: string,
): Promise<LinhaDoEnvioPorMes[]> {
  const db = getDb();

  /*
   * Os envios que têm ao menos uma linha no mês pedido. Em subconsulta e não
   * numa segunda ida ao banco: são a mesma verdade sobre o mesmo instante.
   */
  const doMes = db
    .select({ importId: transactions.importId })
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), eq(transactions.mesReferencia, mes)),
    );

  return (
    db
      .select({
        importId: transactions.importId,
        nomeArquivo: imports.nomeArquivo,
        origem: imports.origem,
        mes: transactions.mesReferencia,
        lancamentos: sql<number>`count(*)::int`,
      })
      .from(transactions)
      .innerJoin(imports, eq(imports.id, transactions.importId))
      /*
       * ⚠ **`user_id` nos dois `where`**, o de dentro e o de fora. Parece
       * redundante e não é: o de dentro escolhe os envios, o de fora é o que
       * continua impedindo um `import_id` alheio de entrar na contagem se um dia
       * a subconsulta mudar de forma.
       *
       * `import_id` é `not null` no schema, com índice próprio — não há linha
       * órfã para tratar, e não precisa de guarda.
       */
      .where(
        and(
          eq(transactions.userId, userId),
          inArray(transactions.importId, doMes),
        ),
      )
      .groupBy(
        transactions.importId,
        imports.nomeArquivo,
        imports.origem,
        transactions.mesReferencia,
      )
  );
}
