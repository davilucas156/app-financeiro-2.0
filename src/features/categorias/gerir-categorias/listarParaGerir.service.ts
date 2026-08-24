import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { buckets, categories, classificationRules, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import type { CategoriaNaGestao, PoteNaGestao } from "./categoriasNaTela";

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
      /*
       * ⚠ **Da tabela de potes**, como na B5.
       *
       * Derivar os potes da lista de categorias faria o pote sem nenhuma
       * sumir — e sumir exatamente da única tela onde daria para criar uma
       * categoria dentro dele. Ficaria inalcançável para sempre.
       */
      db
        .select({
          id: buckets.id,
          slug: buckets.slug,
          nome: buckets.nome,
          emoji: buckets.emoji,
          cor: buckets.cor,
          tipo: buckets.tipo,
          ordem: buckets.ordem,
        })
        .from(buckets)
        .where(eq(buckets.userId, userId))
        .orderBy(asc(buckets.ordem)),

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

  // `categoria_id` é nulo no pendente e no excluído sem classificação: aquela
  // linha do agrupamento é a contagem dos sem-categoria, e não pertence a
  // categoria nenhuma.
  const lancamentos = new Map(
    porLancamento
      .filter((l) => l.categoriaId !== null)
      .map((l) => [l.categoriaId as string, l]),
  );
  // Sem filtro de nulo aqui: `classification_rules.categoria_id` é `not null`
  // — uma regra sem categoria não teria o que aplicar.
  const regras = new Map(porRegra.map((r) => [r.categoriaId, r.total]));

  return {
    potes: potesDoBanco,
    categorias: categoriasDoBanco.map((c) => ({
      ...c,
      lancamentos: lancamentos.get(c.id)?.total ?? 0,
      foraDoCalculo: lancamentos.get(c.id)?.foraDoCalculo ?? 0,
      regras: regras.get(c.id) ?? 0,
    })),
  };
}
