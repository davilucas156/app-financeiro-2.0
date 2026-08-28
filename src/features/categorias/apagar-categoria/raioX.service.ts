import "server-only";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import {
  buckets,
  categories,
  classificationRules,
  transactions,
} from "@/db/schema";
import { getDb } from "@/lib/db";
import type { CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";
import type { OQueVaiJunto } from "./aviso";

/**
 * O que apagar esta categoria leva junto (tarefa B3).
 *
 * É o mesmo número que fez a D9 valer a pena: "já classificou 8" transforma uma
 * lista de textos numa lista de consequências. Aqui ele é a diferença entre
 * apagar e apagar sabendo.
 *
 * ⚠ `userId` vem de `garantirUsuario()`; o id da categoria vem do cliente e
 * entra no `where` **junto** com ele.
 */

export type RaioXDaCategoria = {
  categoria: {
    id: string;
    nome: string;
    emoji: string;
    poteId: string;
    poteNome: string;
  };
  dentro: Required<OQueVaiJunto>;
  /**
   * Para onde os lançamentos podem ir.
   *
   * **Todas as outras da conta**, e não só as do mesmo pote: restringir seria
   * decidir por ele. As do mesmo pote vêm primeiro — não ordenar seria fingir
   * que tanto faz — e o alerta da A3 cobre a escolha de outro pote.
   */
  destinos: CategoriaEscolhivel[];
};

export async function raioXDaCategoria(
  userId: string,
  categoriaId: string,
): Promise<RaioXDaCategoria | null> {
  const db = getDb();

  const [alvo] = await db
    .select({
      id: categories.id,
      nome: categories.nome,
      emoji: categories.emoji,
      poteId: buckets.id,
      poteNome: buckets.nome,
    })
    .from(categories)
    .innerJoin(buckets, eq(buckets.id, categories.bucketId))
    .where(and(eq(categories.id, categoriaId), eq(categories.userId, userId)))
    .limit(1);

  if (!alvo) return null;

  const [[contagem], [regras], outras] = await Promise.all([
    /*
     * ⚠ **Dois números, e não um.**
     *
     * "Os 12 voltam para a revisão" seria falso quando um deles está fora do
     * cálculo: sair do cálculo foi decisão do Davi e não depende de categoria
     * nenhuma. Ele perde a classificação e continua fora.
     *
     * Uma passada conta os dois — duas consultas divergiriam no dia em que uma
     * delas ganhasse um filtro.
     */
    db
      .select({
        total: sql<number>`count(*)::int`,
        foraDoCalculo: sql<number>`count(*) filter (where ${transactions.status} = 'excluido')::int`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.categoriaId, categoriaId),
        ),
      ),

    db
      .select({ n: sql<number>`count(*)::int` })
      .from(classificationRules)
      .where(
        and(
          eq(classificationRules.userId, userId),
          eq(classificationRules.categoriaId, categoriaId),
        ),
      ),

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
      .where(and(eq(categories.userId, userId), ne(categories.id, categoriaId)))
      .orderBy(asc(buckets.ordem), asc(categories.ordem)),
  ]);

  const escolhivel = (c: (typeof outras)[number]): CategoriaEscolhivel => ({
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
  });

  // As do mesmo pote primeiro, o resto na ordem do painel. Ordenar em JS e não
  // num `case` no SQL porque o critério é "o pote desta categoria", que o
  // banco não conhece sem parâmetro.
  const doMesmoPote = outras.filter((c) => c.poteId === alvo.poteId);
  const dosOutros = outras.filter((c) => c.poteId !== alvo.poteId);

  return {
    categoria: alvo,
    dentro: {
      lancamentos: contagem.total,
      foraDoCalculo: contagem.foraDoCalculo,
      regras: regras.n,
    },
    destinos: [...doMesmoPote, ...dosOutros].map(escolhivel),
  };
}
