import { POTES_PADRAO } from "@/features/onboarding/potes-padrao";
import type { PoteNoPainel } from "./poteNoPainel";

/**
 * ⚠ **ANDAIME DA FASE B — sai na D5, junto com a rota `/painel`.**
 *
 * Nenhum número aqui veio do extrato do Davi. São valores inventados,
 * escolhidos para uma coisa só: pôr os **quatro estados de pote lado a lado**.
 *
 * A fase B da spec 03 usou `?estado=` para revisar uma variação por vez. Aqui
 * não serve: a pergunta do portão é se os estados se distinguem **um do lado do
 * outro**, e variante por URL testa cada um sozinho — que é o teste fácil.
 */

const RENDA = 120_000;

/** O mês inventado, com os quatro estados de propósito. */
const VALORES: Record<string, { total: number; lancamentos: number }> = {
  // Normal, folgado.
  "custos-fixos": { total: 14_500, lancamentos: 3 },
  // Normal, quase na meta.
  "liberdade-financeira": { total: 28_000, lancamentos: 1 },
  // **Negativo** — reembolso maior que o gasto.
  "conforto-lazer": { total: -2_000, lancamentos: 5 },
  // **Vazio** — nada caiu aqui.
  "metas-sonhos": { total: 0, lancamentos: 0 },
  // **Estourado** — 125% da meta.
  transporte: { total: 15_000, lancamentos: 14 },
  conhecimento: { total: 4_990, lancamentos: 2 },
  // **Sem meta**, com movimento.
  manutencao: { total: 8_800, lancamentos: 2 },
  "outros-repasses": { total: 45_000, lancamentos: 2 },
  // Renda realizada — bem abaixo da declarada, como no mês real do Davi.
  renda: { total: 21_000, lancamentos: 3 },
};

const DESCRICOES: Record<string, string[]> = {
  "custos-fixos": ["CONTA DE LUZ", "ACADEMIA IMAGINARIA", "STREAMING DE MUSICA"],
  transporte: ["POSTO IMAGINARIO BETIM", "RECARGA DE ONIBUS", "CORRIDA DE APP"],
  "conforto-lazer": ["LANCHONETE INVENTADA", "ESTORNO LANCHONETE"],
  manutencao: ["OFICINA FICTICIA", "PECA DE FREIO"],
};

export const MES_FALSO = "2026-07";
export const RENDA_FALSA = RENDA;

export function potesFalsos(): PoteNoPainel[] {
  return POTES_PADRAO.map((pote) => {
    const v = VALORES[pote.slug] ?? { total: 0, lancamentos: 0 };

    return {
      id: pote.slug,
      slug: pote.slug,
      nome: pote.nome,
      emoji: pote.emoji,
      cor: corDe(pote.classeCor),
      tipo: pote.tipo,
      percentual: pote.percentual,
      observacao: pote.observacao ?? null,
      totalCentavos: v.total,
      lancamentos: v.lancamentos,
      categorias: categoriasFalsas(pote.slug, v),
      lista: listaFalsa(pote.slug, v),
    };
  });
}

/** A soma do topo: não depende de classificação, só de `direcao`. */
export const TOTAIS_FALSOS = {
  entrouCentavos: 141_000,
  saiuCentavos: 118_290,
  diferencaCentavos: 141_000 - 118_290,
  lancamentos: 32,
};

export const COBERTURA_FALSA = {
  incompleta: { saiuPct: 55, entrouPct: 8, completa: false },
  completa: { saiuPct: 100, entrouPct: 100, completa: true },
};

/** `bg-pote-tra` → `var(--color-pote-tra)`. */
function corDe(classeCor: string): string {
  return `var(--color-${classeCor.replace(/^bg-/, "")})`;
}

function categoriasFalsas(
  slug: string,
  v: { total: number; lancamentos: number },
) {
  const pote = POTES_PADRAO.find((p) => p.slug === slug)!;
  if (v.lancamentos === 0) return [];

  // Reparte o total entre as duas primeiras categorias, com o resto na
  // primeira para a soma fechar em centavos inteiros.
  const usadas = pote.categorias.slice(0, Math.min(3, pote.categorias.length));
  const fatia = Math.trunc(v.total / usadas.length);

  return usadas.map((c, i) => ({
    id: `${slug}/${c.slug}`,
    nome: c.nome,
    emoji: c.emoji,
    totalCentavos: i === 0 ? v.total - fatia * (usadas.length - 1) : fatia,
    lancamentos: i === 0 ? v.lancamentos - (usadas.length - 1) : 1,
  }));
}

function listaFalsa(slug: string, v: { total: number; lancamentos: number }) {
  const descricoes = DESCRICOES[slug] ?? [];
  if (v.lancamentos === 0) return [];

  const pote = POTES_PADRAO.find((p) => p.slug === slug)!;

  return descricoes.slice(0, 3).map((descricao, i) => ({
    id: `${slug}-${i}`,
    data: `2026-07-${String(4 + i * 7).padStart(2, "0")}`,
    descricao,
    valorCentavos: Math.max(500, Math.abs(Math.trunc(v.total / 3))),
    direcao: descricao.startsWith("ESTORNO")
      ? ("entrada" as const)
      : ("saida" as const),
    categoriaNome: pote.categorias[i % pote.categorias.length].nome,
    categoriaEmoji: pote.categorias[i % pote.categorias.length].emoji,
    // Só o estorno pede conferência — é o par de valor idêntico da A4.
    conferir: descricao.startsWith("ESTORNO"),
  }));
}
