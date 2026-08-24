import "server-only";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { buckets, categories, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { porcentagemDaCobertura } from "@/features/painel/somar-o-mes/cobertura";
import type { MesNoHistorico } from "./comparativo";

/**
 * O gasto por pote e a cobertura, mês a mês (tarefa C1).
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora.
 *
 * ## Duas consultas agrupadas, nunca uma por mês
 *
 * Doze meses viram doze idas ao banco numa página que já faz cinco. As duas
 * consultas aqui são `group by mes_referencia` — o custo não cresce com o
 * histórico.
 *
 * ## Por que não é uma consulta só
 *
 * A soma por pote precisa do `join` com `categories` e `buckets`; a cobertura
 * **não pode** ter esse `join`, porque ela mede justamente o dinheiro que
 * **não** caiu em pote nenhum. Um `inner join` apagaria o denominador; um
 * `left join` com `group by` de duas dimensões devolveria a mesma linha
 * multiplicada. São perguntas diferentes sobre as mesmas linhas.
 *
 * ## As regras herdadas do `somarOMes`, agora em SQL
 *
 * ⚠ **`excluido` fica de fora inteiro**, dos dois lados. Pagamento de fatura é
 * `excluido` desde a spec 02, e contá-lo faria o gasto do cartão aparecer duas
 * vezes.
 *
 * ⚠ **O total do pote é saída menos entrada**, como o `orientar` do
 * `somarOMes`: um reembolso dentro do pote abate o gasto dele. Somar só as
 * saídas faria o comparativo mostrar um pico onde houve compra e devolução.
 */

/**
 * ⚠ **Só potes de gasto.**
 *
 * O painel já separa os dois blocos porque a barra cheia quer dizer o contrário
 * em cada um. Num comparativo é pior: "Renda subiu 40%" ao lado de "Transporte
 * subiu 40%", pintados da mesma cor, seriam a tela dizendo que as duas coisas
 * são o mesmo tipo de notícia. O comparativo do painel estático também era só
 * de gasto.
 */
export async function historicoDosMeses(
  userId: string,
): Promise<MesNoHistorico[]> {
  const db = getDb();

  const [porPote, porMes, potesDeGasto] = await Promise.all([
    db
      .select({
        mes: transactions.mesReferencia,
        poteId: buckets.id,
        totalCentavos: sql<number>`sum(
          case when ${transactions.direcao} = 'saida'
               then ${transactions.valorCentavos}
               else -${transactions.valorCentavos}
          end
        )::int`,
      })
      .from(transactions)
      .innerJoin(categories, eq(categories.id, transactions.categoriaId))
      .innerJoin(buckets, eq(buckets.id, categories.bucketId))
      .where(
        and(
          eq(transactions.userId, userId),
          ne(transactions.status, "excluido"),
          eq(buckets.tipo, "gasto"),
        ),
      )
      .groupBy(transactions.mesReferencia, buckets.id),

    db
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
        and(
          eq(transactions.userId, userId),
          ne(transactions.status, "excluido"),
        ),
      )
      .groupBy(transactions.mesReferencia),

    /*
     * ⚠ **Os potes vêm da tabela de potes** — a lição da B5 da spec 05.
     *
     * Derivar a lista dos lançamentos faria um pote sem gasto em mês nenhum
     * sumir da comparação. Num painel, pote vazio é uma linha zerada; num
     * comparativo, é o dado. "Você não gastou nada em Conhecimento o ano
     * inteiro" só pode ser lido se a linha estiver lá.
     */
    db
      .select({ id: buckets.id })
      .from(buckets)
      .where(and(eq(buckets.userId, userId), eq(buckets.tipo, "gasto")))
      .orderBy(asc(buckets.ordem)),
  ]);

  const totais = new Map(
    porPote.map((l) => [`${l.mes}:${l.poteId}`, l.totalCentavos]),
  );

  return porMes
    .map((m) => ({
      mes: m.mes,
      coberturaSaiuPct: porcentagemDaCobertura(
        m.saiuClassificadoCentavos,
        m.saiuCentavos,
      ),
      potes: potesDeGasto.map((p) => ({
        poteId: p.id,
        totalCentavos: totais.get(`${m.mes}:${p.id}`) ?? 0,
      })),
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

