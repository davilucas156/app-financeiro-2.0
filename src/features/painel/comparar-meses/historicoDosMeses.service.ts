import "server-only";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { buckets, categories, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { nomeDoTitular } from "@/features/painel/somar-o-mes/nomeDoTitular.service";
import { entradaNaoAbate } from "@/features/painel/somar-o-mes/somarOMes";
import { ehTransferenciaPropria } from "@/features/upload/ler-arquivo/transferenciaPropria";
import { coberturaDosMeses } from "./coberturaDosMeses.service";
import type { MesNoHistorico } from "./comparativo";

/**
 * O gasto por pote e a cobertura, mês a mês (tarefa C1).
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora.
 *
 * ## Consultas agrupadas, nunca uma por mês
 *
 * Doze meses viram doze idas ao banco numa página que já faz cinco. Tudo aqui é
 * `group by mes_referencia` — o custo não cresce com o histórico.
 *
 * ## Por que não é uma consulta só
 *
 * A soma por pote precisa do `join` com `categories` e `buckets`; a cobertura
 * **não pode** ter esse `join`, porque ela mede justamente o dinheiro que
 * **não** caiu em pote nenhum. Um `inner join` apagaria o denominador; um
 * `left join` com `group by` de duas dimensões devolveria a mesma linha
 * multiplicada. São perguntas diferentes sobre as mesmas linhas.
 *
 * A da cobertura mora em `coberturaDosMeses.service.ts` desde a spec 09, porque
 * o painel passou a precisar **só dela**. Esta função a chama; o SQL não é
 * repetido.
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

  const [porPote, porMes, potesDeGasto, entradas, titular] = await Promise.all([
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

    coberturaDosMeses(userId),

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

    /*
     * ⚠ **As entradas dos potes de gasto, com a descrição**, para tirar delas as
     * transferências que são suas. A soma em SQL abate toda entrada; quem sabe
     * se uma é o seu próprio dinheiro passando é `ehTransferenciaPropria`, que
     * lê texto e nome — e isso não cabe num `case when`, porque o banco guarda a
     * descrição com acento e o nome do Clerk pode vir sem.
     *
     * São poucas: reembolso e transferência entre contas, não o extrato.
     */
    db
      .select({
        mes: transactions.mesReferencia,
        poteId: buckets.id,
        valorCentavos: transactions.valorCentavos,
        descricao: transactions.descricaoOriginal,
      })
      .from(transactions)
      .innerJoin(categories, eq(categories.id, transactions.categoriaId))
      .innerJoin(buckets, eq(buckets.id, categories.bucketId))
      .where(
        and(
          eq(transactions.userId, userId),
          ne(transactions.status, "excluido"),
          eq(buckets.tipo, "gasto"),
          eq(transactions.direcao, "entrada"),
        ),
      ),

    nomeDoTitular(userId),
  ]);

  const totais = new Map(
    porPote.map((l) => [`${l.mes}:${l.poteId}`, l.totalCentavos]),
  );

  /*
   * ⚠ **Devolve o que o SQL abateu a mais.** A mesma regra do painel
   * (`entradaNaoAbate`): a entrada sua, vinda de outra conta sua, não abate um
   * pote de gasto. Sem isto o painel de abril mostraria R$ 300 e o comparativo
   * R$ 200 para o mesmo pote — e o ano de aportes teria buracos.
   */
  for (const e of entradas) {
    if (
      !entradaNaoAbate(
        {
          direcao: "entrada",
          transferenciaPropria: ehTransferenciaPropria(e.descricao, titular),
        },
        "gasto",
      )
    ) {
      continue;
    }

    const chave = `${e.mes}:${e.poteId}`;
    totais.set(chave, (totais.get(chave) ?? 0) + e.valorCentavos);
  }

  return porMes.map((m) => ({
    ...m,
    potes: potesDeGasto.map((p) => ({
      poteId: p.id,
      totalCentavos: totais.get(`${m.mes}:${p.id}`) ?? 0,
    })),
  }));
}
