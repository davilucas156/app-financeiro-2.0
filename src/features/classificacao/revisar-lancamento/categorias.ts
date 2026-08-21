import {
  POTES_PADRAO,
  type CategoriaPadrao,
  type PotePadrao,
} from "@/features/onboarding/potes-padrao";
import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";

/**
 * A lista de categorias para escolher, montada a partir de `POTES_PADRAO`.
 *
 * Não invento nada aqui: os potes, as categorias, os emojis e as cores saem do
 * mesmo lugar que a tela `/bem-vindo` e o seed do banco usam. Uma segunda
 * lista divergiria da primeira em algumas semanas.
 *
 * ⚠ A chave é `pote/categoria`, composta, pela mesma razão da A4:
 * `assinaturas` existe em Custos Fixos **e** em Conforto & Lazer, e a
 * unicidade no banco é `(bucket_id, slug)`.
 */

export type CategoriaEscolhivel = {
  chave: string;
  nome: string;
  emoji: string;
  pote: PotePadrao;
};

export function chaveDe(pote: PotePadrao, categoria: CategoriaPadrao): string {
  return `${pote.slug}/${categoria.slug}`;
}

/**
 * ⚠ **Aqui entram os nove potes, renda inclusive** — e essa é a decisão que
 * quase passou batido na C2.
 *
 * "As telas de pote filtram `tipo = 'gasto'`" vale para as telas **de pote**:
 * as de meta, de barra, de rateio. Esta não é uma delas.
 *
 * Um Pix recebido precisa de destino. Esconder renda daqui tornaria toda
 * entrada impossível de classificar à mão — e entrada é justamente o que forma
 * a base sobre a qual os outros oito potes são calculados.
 */
export const POTES_PARA_ESCOLHER = POTES_PADRAO;

/**
 * A ordem muda com a direção do lançamento.
 *
 * Numa lista de 9 potes e 25 categorias, quem acabou de receber um Pix não
 * devia rolar até o fim para achar "Renda extra". Entrada põe renda na frente;
 * saída a manda para o fim.
 *
 * Não é regra de negócio, é ordem de exibição — e a fase B existe para acertar
 * isso antes de ligar os fios.
 */
export function potesNaOrdem(direcao: Direcao): PotePadrao[] {
  const renda = direcao === "entrada";

  return [...POTES_PARA_ESCOLHER].sort((a, b) => {
    const ehRendaA = a.tipo === "renda" ? 1 : 0;
    const ehRendaB = b.tipo === "renda" ? 1 : 0;
    if (ehRendaA !== ehRendaB) return renda ? ehRendaB - ehRendaA : ehRendaA - ehRendaB;
    return a.ordem - b.ordem;
  });
}

export const CATEGORIAS_ESCOLHIVEIS: CategoriaEscolhivel[] =
  POTES_PARA_ESCOLHER.flatMap((pote) =>
    pote.categorias.map((c) => ({
      chave: chaveDe(pote, c),
      nome: c.nome,
      emoji: c.emoji,
      pote,
    })),
  );

const POR_CHAVE = new Map(CATEGORIAS_ESCOLHIVEIS.map((c) => [c.chave, c]));

export function categoriaPorChave(
  chave: string,
): CategoriaEscolhivel | undefined {
  return POR_CHAVE.get(chave);
}
