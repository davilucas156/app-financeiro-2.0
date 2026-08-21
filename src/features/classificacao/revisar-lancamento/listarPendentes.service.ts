import "server-only";
import { and, asc, eq, isNotNull, isNull, ne, or } from "drizzle-orm";
import { buckets, categories, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { pessoaDe } from "@/features/classificacao/motor/pessoa";
import type { Classificado } from "@/features/classificacao/motor/sugestoes";
import type { CategoriaEscolhivel } from "./categorias";
import {
  prepararRevisao,
  type LancamentoPendente,
  type PendenteParaRevisar,
} from "./pendentes";

/**
 * O que `/revisao` lê (tarefa D3).
 *
 * ⚠ **Não aceita `userId` de fora além de quem chama.** A rota o pega de
 * `garantirUsuario()`; nenhum id vindo do cliente entra aqui
 * (`references/architecture.md`, Thin Client / Fat Server).
 */

export type DadosDaRevisao = {
  pendentes: PendenteParaRevisar[];
  categorias: CategoriaEscolhivel[];
};

/**
 * Teto de histórico para as sugestões da A4.
 *
 * A fonte "você já classificou assim" precisa de memória, não do arquivo
 * inteiro: numa conta de dois anos, carregar tudo para sugerir três botões
 * seria caro e não melhoraria o palpite. Os mais recentes são os que se
 * parecem com o mês que você está revisando.
 */
const TETO_DE_HISTORICO = 400;

export async function listarPendentes(
  userId: string,
): Promise<DadosDaRevisao> {
  const db = getDb();

  const [linhas, categoriasDoBanco, historico] = await Promise.all([
    db
      .select({
        id: transactions.id,
        descricao: transactions.descricaoOriginal,
        valorCentavos: transactions.valorCentavos,
        direcao: transactions.direcao,
        data: transactions.data,
        origem: transactions.origem,
        parcela: transactions.parcela,
        categoriaDoBanco: transactions.categoriaDoBanco,
        motivo: transactions.motivo,
        categoriaId: transactions.categoriaId,
        regraChave: transactions.regraChave,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          /*
           * Dois tipos de pendência, e os dois caem nesta tela:
           *
           * - **sem categoria** — nenhuma regra bateu, você escolhe;
           * - **`revisao_pendente`** — par que se anula (spec 02) ou valor
           *   alto que uma regra classificou (D1), e você confirma.
           *
           * Excluído fica de fora: pagamento de fatura não pede decisão.
           */
          or(
            isNull(transactions.categoriaId),
            eq(transactions.status, "revisao_pendente"),
          ),
          // Excluído também tem categoria nula. Sem esta linha, o pagamento de
          // fatura entraria na fila de decisão — e ele não pede decisão
          // nenhuma, é justamente o que a spec 02 já resolveu.
          ne(transactions.status, "excluido"),
        ),
      )
      .orderBy(asc(transactions.data), asc(transactions.id)),

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

    db
      .select({
        descricao: transactions.descricaoOriginal,
        origem: transactions.origem,
        categoriaId: transactions.categoriaId,
        categoriaSlug: categories.slug,
        poteSlug: buckets.slug,
      })
      .from(transactions)
      .innerJoin(categories, eq(categories.id, transactions.categoriaId))
      .innerJoin(buckets, eq(buckets.id, categories.bucketId))
      .where(
        and(eq(transactions.userId, userId), isNotNull(transactions.categoriaId)),
      )
      .limit(TETO_DE_HISTORICO),
  ]);

  const categoriasEscolhiveis: CategoriaEscolhivel[] = categoriasDoBanco.map(
    (c) => ({
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
    }),
  );

  const idPorChave = new Map(
    categoriasEscolhiveis.map((c) => [c.chave, c.id] as [string, string]),
  );

  return {
    categorias: categoriasEscolhiveis,
    pendentes: prepararRevisao(linhas as LancamentoPendente[], {
      idPorChave,
      historico: historico.map(
        (h): Classificado => ({
          descricao: h.descricao,
          origem: h.origem,
          // A fonte "mesma contraparte" da A4 depende disto: sem o nome, um
          // Pix nunca lembraria como voce classificou a mesma pessoa antes.
          pessoa: pessoaDe(h.descricao),
          categoriaId: h.categoriaId!,
          chaveDaCategoria: `${h.poteSlug}/${h.categoriaSlug}`,
        }),
      ),
    }),
  };
}
