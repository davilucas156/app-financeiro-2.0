import {
  POTES_PADRAO,
  type CategoriaPadrao,
  type PotePadrao,
} from "@/features/onboarding/potes-padrao";

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
 * Só os potes de **gasto**.
 *
 * Hoje são todos, porque o pote de renda ainda não existe — ele nasce na C2.
 * A função existe agora para a tela não precisar mudar quando ele nascer.
 */
export const POTES_PARA_ESCOLHER = POTES_PADRAO;

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
