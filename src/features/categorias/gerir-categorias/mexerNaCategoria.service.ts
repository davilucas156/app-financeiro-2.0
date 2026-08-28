import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { buckets, categories, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import type { TransacaoDoBanco } from "@/lib/transacaoDoBanco";
import { ehUnicidadeViolada, restricaoViolada } from "@/lib/erroDoPostgres";
import type { CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";
import { slugUnico } from "@/features/categorias/nomear-categoria/slug";
import { validarCategoria } from "@/features/categorias/nomear-categoria/validar";

/**
 * Criar, renomear e mover categoria (tarefas B1 e B2).
 *
 * ⚠ **`userId` vem de `garantirUsuario()`, nunca de fora.** Todo id que chega
 * daqui — categoria e pote — entra no `where` **junto** com ele
 * (`references/architecture.md`, Thin Client / Fat Server).
 *
 * Apagar mora em outro arquivo de propósito: é a operação que carrega o peso,
 * tem transação própria e uma decisão de destino antes.
 */

export type ResultadoDeMexer =
  { ok: true } | { ok: false; erro: string; campo?: "nome" | "emoji" };

export type ResultadoDeCriar =
  | { ok: true; categoria: CategoriaEscolhivel }
  | { ok: false; erro: string; campo?: "nome" | "emoji" };

/** A mesma mensagem para "não existe" e "não é seu" — a régua da D5 da spec 02. */
const NAO_ENCONTRADA = "Essa categoria não existe mais. Recarregue a tela.";

const POTE_NAO_ENCONTRADO = "Esse pote não existe mais. Recarregue a tela.";

const NOME_REPETIDO = "Já existe uma categoria com esse nome neste pote.";

/**
 * ⚠ Frase **própria**, e não a de nome repetido.
 *
 * O slug é congelado no batismo (A1): mover `gasolina` para um pote que já tem
 * `gasolina` estoura o único de slug mesmo que os nomes sejam "Gasolina" e
 * "Gasolina comum". Dizer "já existe uma com esse nome" faria o Davi ler isso
 * olhando para dois nomes visivelmente diferentes.
 */
const SLUG_REPETIDO =
  "Esse pote já tem uma categoria com um nome parecido demais. Renomeie uma das duas antes de mover.";

// ──────────────────────────────────────────────────────────────────────────
// B1 — criar
// ──────────────────────────────────────────────────────────────────────────

/**
 * O invólucro que abre a transação.
 *
 * A D2 da spec 05 partiu esta função em duas: criar a categoria e classificar o
 * lançamento que motivou a criação precisam acontecer juntas ou não acontecer.
 * Quem já tem uma transação aberta chama `criarCategoriaNaTransacao` direto.
 *
 * O caminho normal — o "+ Nova categoria" da `/categorias` — passa por aqui e
 * ganha de brinde o que antes não tinha: as três consultas (conferir o pote,
 * ler as irmãs, inserir) num instante só.
 */
export async function criarCategoria(
  userId: string,
  entrada: { nome: string; emoji: string; poteId: string },
): Promise<ResultadoDeCriar> {
  return getDb().transaction((tx) =>
    criarCategoriaNaTransacao(tx, userId, entrada),
  );
}

export async function criarCategoriaNaTransacao(
  tx: TransacaoDoBanco,
  userId: string,
  entrada: { nome: string; emoji: string; poteId: string },
): Promise<ResultadoDeCriar> {
  const valida = validarCategoria(entrada);
  if (!valida.ok) {
    return { ok: false, erro: valida.mensagem, campo: valida.campo };
  }

  /*
   * ⚠ **O pote também vem do cliente, e também precisa ser conferido.**
   *
   * Mesma regra da D4 da spec 04: o `user_id` no `where` protege a linha, não
   * o destino dela. Uma categoria criada dentro do pote de outra conta vazaria
   * por leitura — apareceria no painel de quem não pediu.
   */
  const [pote] = await tx
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
    .where(and(eq(buckets.id, entrada.poteId), eq(buckets.userId, userId)))
    .limit(1);

  if (!pote) return { ok: false, erro: POTE_NAO_ENCONTRADO };

  const irmas = await tx
    .select({ slug: categories.slug, ordem: categories.ordem })
    .from(categories)
    .where(
      and(eq(categories.bucketId, pote.id), eq(categories.userId, userId)),
    );

  const slug = slugUnico(
    valida.nome,
    irmas.map((c) => c.slug),
  );

  /*
   * Categoria nova entra no fim, onde a pessoa espera achar o que acabou de
   * criar.
   *
   * `ordem` repetida por corrida não tem único e não precisa: duas empatadas
   * aparecem em alguma ordem, e nenhuma some. Serializar toda criação da conta
   * num `for update` para evitar um empate visual seria caro pelo motivo
   * errado.
   */
  const ordem = irmas.reduce((maior, c) => Math.max(maior, c.ordem), 0) + 1;

  try {
    const [criada] = await tx
      .insert(categories)
      .values({
        userId,
        bucketId: pote.id,
        slug,
        nome: valida.nome,
        emoji: valida.emoji,
        ordem,
      })
      .returning({ id: categories.id });

    return {
      ok: true,
      // Devolvida pronta para ser escolhida: a D2 cria e classifica no mesmo
      // toque, e reler o que acabou de ser inserido seria uma segunda verdade
      // sobre a mesma linha.
      categoria: {
        id: criada.id,
        chave: `${pote.slug}/${slug}`,
        nome: valida.nome,
        emoji: valida.emoji,
        ordem,
        pote: {
          id: pote.id,
          slug: pote.slug,
          nome: pote.nome,
          emoji: pote.emoji,
          cor: pote.cor,
          tipo: pote.tipo,
          ordem: pote.ordem,
        },
      },
    };
  } catch (erro) {
    return traduzir(erro, "nome");
  }
}

// ──────────────────────────────────────────────────────────────────────────
// B2 — renomear e mover
// ──────────────────────────────────────────────────────────────────────────

/**
 * ⚠ **O slug não muda.** É a descoberta 3, e é o ponto inteiro dela: o
 * `onConflictDoNothing` do onboarding é idempotente **pelo slug**, então um
 * slug novo faria o próximo reseed recriar a categoria original ao lado da
 * renomeada — com metade do histórico em cada.
 *
 * Só `(bucket_id, nome)` pode estourar aqui, porque o slug ficou parado.
 */
export async function renomearCategoria(
  userId: string,
  categoriaId: string,
  entrada: { nome: string; emoji: string },
): Promise<ResultadoDeMexer> {
  const valida = validarCategoria(entrada);
  if (!valida.ok) {
    return { ok: false, erro: valida.mensagem, campo: valida.campo };
  }

  try {
    const [mexida] = await getDb()
      .update(categories)
      .set({ nome: valida.nome, emoji: valida.emoji })
      .where(and(eq(categories.id, categoriaId), eq(categories.userId, userId)))
      .returning({ id: categories.id });

    return mexida ? { ok: true } : { ok: false, erro: NAO_ENCONTRADA };
  } catch (erro) {
    return traduzir(erro, "nome");
  }
}

/**
 * Mover de pote — **só enquanto a categoria estiver vazia**.
 *
 * Descoberta 4: não existe histórico de "a que pote esta categoria pertencia em
 * julho". Mover reescreve todos os meses anteriores em silêncio, e com a
 * categoria vazia não há passado para reescrever.
 */
export async function moverCategoria(
  userId: string,
  categoriaId: string,
  poteId: string,
): Promise<ResultadoDeMexer> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [categoria] = await tx
      .select({ id: categories.id, bucketId: categories.bucketId })
      .from(categories)
      .where(and(eq(categories.id, categoriaId), eq(categories.userId, userId)))
      .for("update")
      .limit(1);

    if (!categoria) return { ok: false, erro: NAO_ENCONTRADA };

    // O toque repetido, o botão pressionado duas vezes, o formulário
    // reenviado. Recusar seria inventar um erro para uma operação que já está
    // no estado pedido.
    if (categoria.bucketId === poteId) return { ok: true };

    const [pote] = await tx
      .select({ id: buckets.id })
      .from(buckets)
      .where(and(eq(buckets.id, poteId), eq(buckets.userId, userId)))
      .limit(1);

    if (!pote) return { ok: false, erro: POTE_NAO_ENCONTRADO };

    /*
     * ⚠ **Não filtra `status`.**
     *
     * Um lançamento marcado fora do cálculo continua com a categoria e
     * continua sendo passado: se ele voltar, o rateio já terá sido reescrito.
     * Filtrar excluídos aqui seria decidir que uma parte do passado não conta.
     */
    const [dentro] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.categoriaId, categoriaId),
        ),
      );

    if (dentro.n > 0) {
      // A recusa carrega o número: "tem 12 lançamentos dentro" explica;
      // "não é possível mover" só frustra.
      return {
        ok: false,
        erro: `Esta categoria já tem ${dentro.n} ${dentro.n === 1 ? "lançamento" : "lançamentos"}. Mover de pote agora mudaria o rateio de todos os meses anteriores — só dá para mover enquanto ela está vazia.`,
      };
    }

    const [ultima] = await tx
      .select({
        maior: sql<number>`coalesce(max(${categories.ordem}), 0)::int`,
      })
      .from(categories)
      .where(
        and(eq(categories.bucketId, poteId), eq(categories.userId, userId)),
      );

    try {
      await tx
        .update(categories)
        .set({ bucketId: poteId, ordem: ultima.maior + 1 })
        .where(
          and(eq(categories.id, categoriaId), eq(categories.userId, userId)),
        );

      return { ok: true };
    } catch (erro) {
      return traduzir(erro, "slug");
    }
  });
}

/**
 * O `23505` virando frase.
 *
 * `categories` tem **dois** únicos, e eles falham por motivos diferentes — daí
 * `restricaoViolada` e não só "foi duplicata". O `esperado` diz qual das duas a
 * operação podia produzir, e a outra ainda assim é traduzida: uma frase
 * genérica é melhor do que um 500, mas errar qual delas seria pior do que as
 * duas.
 */
function traduzir(
  erro: unknown,
  esperado: "nome" | "slug",
): { ok: false; erro: string; campo?: "nome" } {
  if (!ehUnicidadeViolada(erro)) throw erro;

  /*
   * ⚠ **Nome antes de slug**, e a ordem importa.
   *
   * Mover "Gasolina" para um pote que já tem "Gasolina" viola os **dois**
   * únicos, e o Postgres reporta um só — medido: ele reporta o de nome. Se o
   * slug viesse primeiro na leitura, a tela diria "nome parecido demais"
   * olhando para dois nomes idênticos.
   *
   * Nome repetido é a mensagem mais acionável das duas: dá para consertar
   * digitando.
   */
  if (restricaoViolada(erro, "categories_bucket_id_nome_unq")) {
    return { ok: false, erro: NOME_REPETIDO, campo: "nome" };
  }

  if (restricaoViolada(erro, "categories_bucket_id_slug_unq")) {
    return { ok: false, erro: SLUG_REPETIDO };
  }

  return esperado === "nome"
    ? { ok: false, erro: NOME_REPETIDO, campo: "nome" }
    : { ok: false, erro: SLUG_REPETIDO };
}
