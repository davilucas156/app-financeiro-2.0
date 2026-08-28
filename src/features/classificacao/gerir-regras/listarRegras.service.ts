import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import {
  buckets,
  categories,
  classificationRules,
  transactions,
} from "@/db/schema";
import { getDb } from "@/lib/db";
import { oQueEstaRegraProcura, type RegraNaTela } from "./regrasNaTela";
import type { CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";

/**
 * O que `/regras` lê (tarefa D9).
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora
 * (`references/architecture.md`, Thin Client / Fat Server).
 */

export type DadosDasRegras = {
  regras: RegraNaTela[];
  /** Para o seletor de destino — as mesmas categorias que a revisão oferece. */
  categorias: CategoriaEscolhivel[];
};

export async function listarRegras(userId: string): Promise<DadosDasRegras> {
  const db = getDb();

  const [linhas, categoriasDoBanco] = await Promise.all([
    db
      .select({
        id: classificationRules.id,
        criterio: classificationRules.criterio,
        categoriaId: classificationRules.categoriaId,
        prioridade: classificationRules.prioridade,
        origem: classificationRules.origem,
        categoriaNome: categories.nome,
        categoriaEmoji: categories.emoji,
        poteNome: buckets.nome,
        poteCor: buckets.cor,
        /*
         * ⚠ O filtro por usuário entra **no `on`**, não no `where`.
         *
         * No `where` ele transformaria o `left join` em `inner join`, e regra
         * que nunca classificou nada sumiria da lista — justamente a que mais
         * merece ser olhada.
         */
        jaClassificou: sql<number>`count(${transactions.id})::int`,
      })
      .from(classificationRules)
      .innerJoin(categories, eq(categories.id, classificationRules.categoriaId))
      .innerJoin(buckets, eq(buckets.id, categories.bucketId))
      .leftJoin(
        transactions,
        and(
          eq(transactions.regraId, classificationRules.id),
          eq(transactions.userId, userId),
        ),
      )
      .where(eq(classificationRules.userId, userId))
      .groupBy(
        classificationRules.id,
        categories.nome,
        categories.emoji,
        buckets.nome,
        buckets.cor,
      )
      // Alfabética pelo texto que a regra procura: com 27 regras, achar
      // "PETROBRAS" não pode exigir lembrar em que pote ela cai. E a linha não
      // salta de lugar depois de uma edição que não mexeu no texto.
      .orderBy(asc(classificationRules.chave)),

    db
      .select({
        id: categories.id,
        slug: categories.slug,
        nome: categories.nome,
        emoji: categories.emoji,
        ordem: categories.ordem,
        poteId: buckets.id,
        poteSlug: buckets.slug,
        poteNome: buckets.nome,
        poteEmoji: buckets.emoji,
        poteCor: buckets.cor,
        poteTipo: buckets.tipo,
        poteOrdem: buckets.ordem,
      })
      .from(categories)
      .innerJoin(buckets, eq(buckets.id, categories.bucketId))
      .where(eq(categories.userId, userId)),
  ]);

  return {
    regras: linhas.map((l) => ({
      id: l.id,
      criterio: l.criterio,
      texto: oQueEstaRegraProcura(l.criterio),
      categoriaId: l.categoriaId,
      categoriaNome: l.categoriaNome,
      categoriaEmoji: l.categoriaEmoji,
      poteNome: l.poteNome,
      poteCor: l.poteCor,
      prioridade: l.prioridade,
      origem: l.origem,
      jaClassificou: l.jaClassificou,
    })),

    categorias: categoriasDoBanco.map((c) => ({
      id: c.id,
      chave: `${c.poteSlug}/${c.slug}`,
      nome: c.nome,
      emoji: c.emoji,
      ordem: c.ordem,
      pote: {
        id: c.poteId,
        slug: c.poteSlug,
        nome: c.poteNome,
        emoji: c.poteEmoji,
        cor: c.poteCor,
        tipo: c.poteTipo,
        ordem: c.poteOrdem,
      },
    })),
  };
}
