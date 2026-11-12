import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { categories, classificationRules, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { potesDoUsuario } from "./potesDoUsuario";
import {
  juntarContagens,
  type CategoriaNaGestao,
  type PoteNaGestao,
} from "./categoriasNaTela";

/**
 * O que a `/categorias` lê (tarefa D1).
 *
 * A B3 conta **uma** categoria, para a tela de confirmação. Esta conta todas,
 * para a linha de orientação de cada cartão — e é por isso que as duas existem
 * em vez de uma.
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora.
 */

export type DadosDaGestao = {
  potes: PoteNaGestao[];
  categorias: CategoriaNaGestao[];
};

export async function listarParaGerir(userId: string): Promise<DadosDaGestao> {
  const db = getDb();

  const [potesDoBanco, categoriasDoBanco, porLancamento, porRegra] =
    await Promise.all([
      // Da tabela de potes, e não derivados das categorias — ver o helper.
      potesDoUsuario(userId),

      db
        .select({
          id: categories.id,
          nome: categories.nome,
          emoji: categories.emoji,
          ordem: categories.ordem,
          poteId: categories.bucketId,
        })
        .from(categories)
        .where(eq(categories.userId, userId))
        .orderBy(asc(categories.ordem)),

      /*
       * ⚠ **Duas passadas, e não uma junção.**
       *
       * `transactions` e `classification_rules` apontam as duas para
       * `categories`. Juntar as três e contar daria o produto das duas pontas:
       * 12 lançamentos e 2 regras virariam 24 de cada. Não é um erro que a tela
       * denuncia — dobra o número e continua parecendo um número.
       */
      db
        .select({
          categoriaId: transactions.categoriaId,
          total: sql<number>`count(*)::int`,
          foraDoCalculo: sql<number>`count(*) filter (where ${transactions.status} = 'excluido')::int`,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .groupBy(transactions.categoriaId),

      db
        .select({
          categoriaId: classificationRules.categoriaId,
          total: sql<number>`count(*)::int`,
        })
        .from(classificationRules)
        .where(eq(classificationRules.userId, userId))
        .groupBy(classificationRules.categoriaId),
    ]);

  return {
    potes: potesDoBanco,
    categorias: juntarContagens(categoriasDoBanco, porLancamento, porRegra),
  };
}
