import "server-only";
import { eq, sql } from "drizzle-orm";
import { transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import {
  jaClassificado,
  naFilaDeRevisao,
} from "@/features/classificacao/revisar-lancamento/filaDeRevisao";

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
  /**
   * Já têm categoria, vindo de regra ou da sua mão.
   *
   * Só passou a ser um número interessante na spec 03 — antes dela era zero por
   * construção.
   */
  classificados: number;
  /**
   * O tamanho **exato** da fila de `/revisao` (D8).
   *
   * ⚠ Sobrepõe-se a `classificados` no lançamento de valor alto: ele está
   * classificado **e** pede confirmação. A sobreposição é real, é a mesma que a
   * D2 documentou em `paraDecidir`, e escolher um dos dois lados esconderia
   * metade do fato.
   */
  paraDecidir: number;
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
        // ⚠ **Os dois critérios vêm de `filaDeRevisao.ts`**, o mesmo arquivo
        // que `/revisao` usa no `where` (D8). O painel diz "N para decidir" e
        // leva até lá; contar diferente aqui seria mostrar 17 e abrir uma tela
        // com 23 — a mentira por omissão que a D2 consertou no upload.
        classificados: quantos(jaClassificado()),
        paraDecidir: quantos(naFilaDeRevisao()),
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
    classificados: 0,
    paraDecidir: 0,
    foraDoCalculo: 0,
  };

  return { ...c, meses: meses.map((m) => m.mes) };
}
