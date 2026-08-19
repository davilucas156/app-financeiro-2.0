import "server-only";
import { eq, sql } from "drizzle-orm";
import { transactions } from "@/db/schema";
import { getDb } from "@/lib/db";

/**
 * Quantos lançamentos existem e em que estado (tarefa D6).
 *
 * **Não é o painel.** O painel — potes, gastos por categoria, comparação com o
 * mês anterior — tem spec própria e depende da classificação existir. Aqui só
 * respondo o suficiente para a tela parar de dizer "nenhum mês fechado ainda"
 * depois que você importou 54 lançamentos.
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora — mesma razão de
 * `listarImportacoes` (`references/architecture.md`, Thin Client / Fat Server).
 */

export type ResumoDeLancamentos = {
  total: number;
  /** Importados e ainda sem categoria: o que a próxima spec vai resolver. */
  aguardandoClassificacao: number;
  /** Pares que parecem se anular, esperando você decidir. */
  emRevisao: number;
  /** Pagamento de fatura e afins: guardados, fora da conta de gastos. */
  foraDoCalculo: number;
  /** `YYYY-MM`, do mais recente para o mais antigo. */
  meses: string[];
};

/** `count(*) filter (where …)` — uma varredura só para as quatro contagens. */
const quantos = (condicao: ReturnType<typeof sql>) =>
  sql<number>`count(*) filter (where ${condicao})::int`;

export async function resumoDeLancamentos(
  userId: string,
): Promise<ResumoDeLancamentos> {
  const db = getDb();

  const [contagens, meses] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        aguardandoClassificacao: quantos(
          sql`${transactions.status} = 'importado' and ${transactions.categoriaId} is null`,
        ),
        emRevisao: quantos(sql`${transactions.status} = 'revisao_pendente'`),
        foraDoCalculo: quantos(sql`${transactions.status} = 'excluido'`),
      })
      .from(transactions)
      .where(eq(transactions.userId, userId)),

    db
      .selectDistinct({ mes: transactions.mesReferencia })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(sql`${transactions.mesReferencia} desc`),
  ]);

  // `count` sobre zero linhas ainda devolve uma linha com zeros — mas o tipo
  // não sabe disso, e um `!` aqui seria mentira de tipo por conveniência.
  const c = contagens[0] ?? {
    total: 0,
    aguardandoClassificacao: 0,
    emRevisao: 0,
    foraDoCalculo: 0,
  };

  return { ...c, meses: meses.map((m) => m.mes) };
}
