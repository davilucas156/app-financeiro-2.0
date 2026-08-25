import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { porcentagemDaCobertura } from "@/features/painel/somar-o-mes/cobertura";
import type { MesComCobertura } from "./comparativo";

/**
 * Quais meses a conta tem, e quanto de cada um está classificado (spec 09, A2).
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora.
 *
 * ## Por que virou arquivo próprio
 *
 * Esta consulta já existia dentro do `historicoDosMeses`. Quando o comparativo
 * saiu do painel, o painel ficou precisando **só dela** — o suficiente para
 * dizer "comparado com maio" e convidar para a tela nova, sem refazer a soma
 * por pote, que é a parte cara.
 *
 * O `historicoDosMeses` passou a chamar esta função em vez de repetir o SQL.
 * Duas cópias da mesma cobertura divergiriam no dia em que uma regra mudasse, e
 * a divergência apareceria como o painel e a `/comparativo` discordando sobre
 * quantos meses entram na média.
 *
 * ## Sem `join`, e é o ponto
 *
 * A cobertura mede justamente o dinheiro que **não** caiu em pote nenhum. Um
 * `inner join` com `categories` apagaria o denominador — sobrariam só os
 * lançamentos classificados, e a conta daria 100% em todo mês.
 *
 * ⚠ **`excluido` fica de fora.** Pagamento de fatura é `excluido` desde a spec
 * 02: ele não é gasto, é a transferência que quita os gastos do cartão.
 */
export async function coberturaDosMeses(
  userId: string,
): Promise<MesComCobertura[]> {
  const db = getDb();

  const linhas = await db
    .select({
      mes: transactions.mesReferencia,
      saiuCentavos: sql<number>`coalesce(sum(
        case when ${transactions.direcao} = 'saida'
             then ${transactions.valorCentavos} else 0 end
      ), 0)::int`,
      /*
       * ⚠ **`categoria_id is not null` e não um `join`** — ver a nota do topo.
       * A coluna é `set null` ao apagar a categoria, então um lançamento que
       * perdeu a categoria volta a contar como não classificado, que é
       * exatamente o que ele passou a ser.
       */
      saiuClassificadoCentavos: sql<number>`coalesce(sum(
        case when ${transactions.direcao} = 'saida'
              and ${transactions.categoriaId} is not null
             then ${transactions.valorCentavos} else 0 end
      ), 0)::int`,
    })
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), ne(transactions.status, "excluido")),
    )
    .groupBy(transactions.mesReferencia);

  return linhas
    .map((m) => ({
      mes: m.mes,
      coberturaSaiuPct: porcentagemDaCobertura(
        m.saiuClassificadoCentavos,
        m.saiuCentavos,
      ),
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}
