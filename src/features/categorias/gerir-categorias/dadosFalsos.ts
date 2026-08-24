import { POTES_PADRAO } from "@/features/onboarding/potes-padrao";
import type { CategoriaNaGestao, PoteNaGestao } from "./categoriasNaTela";

/**
 * O protótipo da fase C — **morre na D1**.
 *
 * Mesma mecânica do `dadosFalsos.ts` do `/painel` na spec 04, que foi apagado
 * inteiro quando o `/dashboard` ficou pronto.
 *
 * ## Os potes são os de verdade; os números não
 *
 * Estrutura de `POTES_PADRAO` — que é molde de seed, não dado do Davi — para a
 * tela mostrar os nove potes com os nomes e as cores que ele vai ver de fato.
 * As contagens são inventadas e escolhidas para exibir cada caso que o cartão
 * precisa distinguir.
 */

/**
 * As situações que a tela tem de distinguir, uma em cada categoria.
 *
 * Chaveado por `pote/categoria` e não só pelo slug da categoria: `assinaturas`
 * existe em dois potes, e uma chave curta daria a mesma contagem às duas.
 */
const CONTAGENS: Record<
  string,
  { lancamentos: number; foraDoCalculo: number; regras: number }
> = {
  // Muito usada: "Mover de pote" sai da tela e apagar assusta.
  "custos-fixos/telefonia": { lancamentos: 12, foraDoCalculo: 1, regras: 2 },
  // Só regra pendurada, nenhum lançamento: mover continua liberado, e o aviso
  // de apagar fala só de regras.
  "custos-fixos/academia": { lancamentos: 0, foraDoCalculo: 0, regras: 3 },
  // Um de cada, para ver o singular.
  "custos-fixos/assinaturas": { lancamentos: 1, foraDoCalculo: 0, regras: 1 },
  // Tudo fora do cálculo: o aviso do "devolver" muda de frase inteira.
  "conforto-lazer/assinaturas": { lancamentos: 2, foraDoCalculo: 2, regras: 0 },
  // O caso comum.
  "transporte/gasolina": { lancamentos: 8, foraDoCalculo: 0, regras: 1 },
};

const PADRAO = { lancamentos: 0, foraDoCalculo: 0, regras: 0 };

/**
 * ⚠ **Um pote fica sem categoria nenhuma, de propósito.**
 *
 * É o caso da B5: com o seed isso nunca acontece, e é justamente o caso em que
 * a tela erraria feio — o pote sumiria da única página onde daria para criar
 * uma categoria dentro dele.
 */
const POTE_ESVAZIADO = "manutencao";

export const POTES_FALSOS: PoteNaGestao[] = POTES_PADRAO.map((p) => ({
  id: `pote-${p.slug}`,
  slug: p.slug,
  nome: p.nome,
  emoji: p.emoji,
  cor: p.hex,
  tipo: p.tipo,
  ordem: p.ordem,
}));

export const CATEGORIAS_FALSAS: CategoriaNaGestao[] = POTES_PADRAO.filter(
  (p) => p.slug !== POTE_ESVAZIADO,
).flatMap((p) =>
  p.categorias.map((c) => ({
    id: `cat-${p.slug}-${c.slug}`,
    nome: c.nome,
    emoji: c.emoji,
    ordem: c.ordem,
    poteId: `pote-${p.slug}`,
    ...(CONTAGENS[`${p.slug}/${c.slug}`] ?? PADRAO),
  })),
);
