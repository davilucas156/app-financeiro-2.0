import "server-only";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { buckets, categories, decisionUndo, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { pessoaDe } from "@/features/classificacao/motor/pessoa";
import type { Classificado } from "@/features/classificacao/motor/sugestoes";
import type { PoteNaGestao } from "@/features/categorias/gerir-categorias/categoriasNaTela";
import type { CategoriaEscolhivel } from "./categorias";
import type { PodeVoltar } from "./desfazer";
import { naFilaDeRevisao } from "./filaDeRevisao";
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
  /**
   * Os nove potes, para o "+ Nova categoria" da C2 da spec 05.
   *
   * ⚠ **Da tabela de potes, e não derivados das categorias** — a mesma lição da
   * B5: um pote sem categoria nenhuma sumiria da lista, e sumiria exatamente do
   * lugar onde daria para criar a primeira categoria dentro dele.
   */
  potes: PoteNaGestao[];
  /** A sombra da última decisão, ou nada — é o que acende o "Voltar" (D6). */
  voltar: PodeVoltar | null;
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

  const [linhas, potesDoBanco, categoriasDoBanco, historico, sombra] = await Promise.all([
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
        // ⚠ **A definição da fila mora em `filaDeRevisao.ts`** desde a D8. O
        // painel conta com o mesmo critério, e as duas cópias divergiriam no
        // dia em que alguém ajustasse uma delas.
        and(eq(transactions.userId, userId), naFilaDeRevisao()),
      )
      .orderBy(asc(transactions.data), asc(transactions.id)),

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

    /*
     * O que o "Voltar" reabriria (D6).
     *
     * `innerJoin` e não uma leitura solta: a descrição vem do lançamento vivo,
     * não de uma cópia congelada. Se ele deixou de existir, o join não devolve
     * nada e o botão apaga — que é a resposta certa.
     */
    db
      .select({
        descricao: transactions.descricaoOriginal,
        regraCriada: decisionUndo.regraCriada,
        irmaos: decisionUndo.irmaos,
      })
      .from(decisionUndo)
      .innerJoin(transactions, eq(transactions.id, decisionUndo.transactionId))
      .where(eq(decisionUndo.userId, userId))
      .limit(1),
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
    potes: potesDoBanco,
    voltar: sombra[0] ?? null,
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
