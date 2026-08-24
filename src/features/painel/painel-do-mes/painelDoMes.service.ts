import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { buckets, categories, transactions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { naFilaDeRevisao } from "@/features/classificacao/revisar-lancamento/filaDeRevisao";
import type { CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";
import { coberturaDoMes, type Cobertura } from "@/features/painel/somar-o-mes/cobertura";
import { paresDeValorIdentico } from "@/features/painel/somar-o-mes/paresDeValorIdentico";
import { somarOMes, type CategoriaComPote } from "@/features/painel/somar-o-mes/somarOMes";
import { rendaDoMes } from "@/features/painel/renda-do-mes/rendaDoMes.service";
import type { RendaDeclarada } from "@/features/painel/renda-do-mes/rendaDeclarada";
import type {
  LancamentoNoPainel,
  PoteNoPainel,
} from "./poteNoPainel";

/**
 * O que o painel lê (tarefas D1 e D3).
 *
 * ⚠ `userId` vem de `garantirUsuario()`, nunca de fora — e o `mes` **vem do
 * cliente**, então ele entra no `where` junto com o `user_id` e é conferido
 * contra a lista de meses que a própria conta tem.
 *
 * ## Uma passada de lançamentos serve a tudo
 *
 * A soma dos potes, as categorias, a cobertura em dinheiro e a lista de dentro
 * do pote saem das **mesmas linhas**. Consultar de novo para a lista seria uma
 * segunda verdade sobre o mesmo mês — e duas verdades divergem no dia em que um
 * dos dois `where` for ajustado.
 */

export type DadosDoPainel = {
  mes: string;
  meses: string[];
  entrouCentavos: number;
  saiuCentavos: number;
  diferencaCentavos: number;
  cobertura: Cobertura;
  /** Quantos lançamentos ainda esperam decisão — o tamanho da fila de `/revisao`. */
  faltamDecidir: number;
  renda: RendaDeclarada | null;
  potes: PoteNoPainel[];
  /**
   * As categorias que a troca da D4 oferece.
   *
   * ⚠ Saem da **mesma** consulta que monta os potes, com uma coluna a mais
   * (`categories.slug`). Uma segunda consulta seria uma segunda verdade sobre
   * as mesmas categorias — a mesma razão pela qual uma passada de lançamentos
   * serve a tudo aqui.
   */
  categorias: CategoriaEscolhivel[];
};

export async function dadosDoPainel(
  userId: string,
  mesPedido?: string,
): Promise<DadosDoPainel | null> {
  const db = getDb();

  const porMes = await db
    .select({
      mes: transactions.mesReferencia,
      /*
       * ⚠ **Contados só os que entram na conta.**
       *
       * Encontrado contra o banco real: a conta do Davi tinha um mês com
       * **um** lançamento, e ele era um pagamento de fatura — `excluido` desde
       * a spec 02. O painel abria ali e mostrava uma tela zerada, enquanto o
       * mês anterior tinha 53 lançamentos.
       *
       * "Abre no mês atual lançado" quer dizer o mês que tem o que mostrar, e
       * não o mês onde sobrou uma linha que a própria importação já tirou do
       * cálculo.
       */
      comMovimento: sql<number>`count(*) filter (where ${transactions.status} <> 'excluido')::int`,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .groupBy(transactions.mesReferencia)
    .orderBy(desc(transactions.mesReferencia));

  if (porMes.length === 0) return null;

  // O seletor mostra **todos** os meses: um mês só de pagamento de fatura
  // existe, e esconder da navegação seria negar que ele existe. O que muda é
  // qual deles abre sozinho.
  const meses = porMes.map((m) => m.mes);
  const padrao = (porMes.find((m) => m.comMovimento > 0) ?? porMes[0]).mes;

  /*
   * ⚠ O mês vem da URL, e um mês inventado não pode virar consulta.
   *
   * Conferir contra a lista da própria conta resolve dois casos de uma vez: o
   * link velho para um mês que foi desfeito, e o parâmetro adivinhado.
   */
  const mes = mesPedido && meses.includes(mesPedido) ? mesPedido : padrao;

  const [linhas, potesDoBanco, categoriasDoBanco, renda, [pendencia]] = await Promise.all([
    db
      .select({
        id: transactions.id,
        data: transactions.data,
        descricao: transactions.descricaoOriginal,
        valorCentavos: transactions.valorCentavos,
        direcao: transactions.direcao,
        status: transactions.status,
        categoriaId: transactions.categoriaId,
        classificadoPor: transactions.classificadoPor,
        regraChave: transactions.regraChave,
        fonteDaSugestao: transactions.fonteDaSugestao,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.mesReferencia, mes),
        ),
      )
      .orderBy(asc(transactions.data), asc(transactions.id)),

    /*
     * ⚠ **Os potes vêm da tabela de potes** (tarefa B5 da spec 05).
     *
     * Até aqui eles saíam do `innerJoin` com `categories`, e com o seed isso
     * nunca apareceu: todo pote tinha categoria. A B4 da spec 05 tornou o
     * defeito alcançável — apagar a última categoria de um pote faria o join
     * não devolver linha nenhuma para ele, e o pote sumiria da tela.
     *
     * A A3 desta spec é explícita em sentido contrário: **pote ausente da tela
     * não é o mesmo que pote vazio.**
     *
     * Duas consultas e não um `leftJoin` porque uma seleção plana de duas
     * tabelas num `leftJoin` não carrega a nulidade no tipo — o TypeScript
     * prometeria colunas que viriam nulas. Estas duas já cabem no
     * `Promise.all` que existe.
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
        percentual: buckets.percentualMeta,
        observacao: buckets.observacao,
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
      .where(eq(categories.userId, userId))
      .orderBy(asc(buckets.ordem), asc(categories.ordem)),

    rendaDoMes(userId, mes),

    db
      .select({ n: sql<number>`count(*)::int` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.mesReferencia, mes),
          naFilaDeRevisao(),
        ),
      ),
  ]);

  const paraSomar: CategoriaComPote[] = categoriasDoBanco.map((c) => ({
    id: c.id,
    pote: { id: c.poteId, tipo: c.poteTipo },
  }));

  const escolhiveis: CategoriaEscolhivel[] = categoriasDoBanco.map((c) => ({
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
  }));

  const soma = somarOMes(linhas, paraSomar);
  const somaPorPote = new Map(soma.potes.map((p) => [p.poteId, p]));
  const categoriaPorId = new Map(categoriasDoBanco.map((c) => [c.id, c]));

  // Um pote por vez, na ordem do banco — inclusive os que não receberam nada
  // **e os que não têm categoria nenhuma**. Pote ausente da tela não é o mesmo
  // que pote vazio, e a A3 distingue os dois.
  const potes: PoteNoPainel[] = potesDoBanco.map((p) => {
    const somaDele = somaPorPote.get(p.id);
    const lista = listaDoPote(linhas, categoriaPorId, p.id);

    return {
      id: p.id,
      slug: p.slug,
      nome: p.nome,
      emoji: p.emoji,
      cor: p.cor,
      tipo: p.tipo,
      percentual: p.percentual,
      observacao: p.observacao,
      totalCentavos: somaDele?.totalCentavos ?? 0,
      lancamentos: somaDele?.lancamentos ?? 0,
      categorias: (somaDele?.categorias ?? []).map((c) => ({
        id: c.categoriaId,
        nome: categoriaPorId.get(c.categoriaId)?.nome ?? "categoria removida",
        emoji: categoriaPorId.get(c.categoriaId)?.emoji ?? "❓",
        totalCentavos: c.totalCentavos,
        lancamentos: c.lancamentos,
      })),
      lista,
    };
  });

  return {
    mes,
    meses,
    entrouCentavos: soma.entrouCentavos,
    saiuCentavos: soma.saiuCentavos,
    diferencaCentavos: soma.diferencaCentavos,
    cobertura: coberturaDoMes(soma),
    faltamDecidir: pendencia?.n ?? 0,
    renda,
    potes,
    categorias: escolhiveis,
  };
}

type LinhaDoBanco = {
  id: string;
  data: string;
  descricao: string;
  valorCentavos: number;
  direcao: "entrada" | "saida";
  status: "importado" | "revisao_pendente" | "excluido";
  categoriaId: string | null;
  classificadoPor: "regra" | "sugestao" | "manual" | null;
  regraChave: string | null;
  fonteDaSugestao: string | null;
};

/**
 * Os lançamentos daquele pote (tarefa D3).
 *
 * Cada um traz **de onde veio a classificação** — a procedência da C3. É aqui
 * que "por que isso caiu em Lazer?" ganha resposta na tela, seis meses depois,
 * que é a única razão daquelas colunas existirem.
 */
function listaDoPote(
  linhas: LinhaDoBanco[],
  categoriaPorId: Map<string, { nome: string; emoji: string; poteId: string }>,
  poteId: string,
): LancamentoNoPainel[] {
  const doPote = linhas.filter(
    (l) =>
      l.status !== "excluido" &&
      l.categoriaId !== null &&
      categoriaPorId.get(l.categoriaId)?.poteId === poteId,
  );

  const conferir = paresDeValorIdentico(doPote);

  return doPote.map((l) => {
    const categoria = categoriaPorId.get(l.categoriaId!);

    return {
      id: l.id,
      data: l.data,
      descricao: l.descricao,
      valorCentavos: l.valorCentavos,
      direcao: l.direcao,
      categoriaId: l.categoriaId!,
      categoriaNome: categoria?.nome ?? "categoria removida",
      categoriaEmoji: categoria?.emoji ?? "❓",
      procedencia: procedencia(l),
      veioDeRegra: l.classificadoPor === "regra",
      conferir: conferir.has(l.id),
    };
  });
}

/** A frase que responde "por que isso caiu aqui?" (C3). */
function procedencia(l: LinhaDoBanco): string {
  switch (l.classificadoPor) {
    case "regra":
      return l.regraChave
        ? `uma regra procurava por ${l.regraChave.split(":").slice(1).join(":")}`
        : "uma regra que já foi apagada";
    case "sugestao":
      return `você aceitou a sugestão (${l.fonteDaSugestao ?? "sem fonte"})`;
    case "manual":
      return "você escolheu";
    default:
      return "sem procedência";
  }
}
