import type { Criterio } from "@/features/classificacao/motor/regras";
import { textoDoCriterio } from "@/features/classificacao/motor/chaveDaRegra";
import { emReais } from "@/lib/dinheiro";

/**
 * O que a tela de regras mostra e o que ela deixa mexer (tarefa D9).
 *
 * Puro, e num `.ts` de propósito: o serviço é `server-only` e o componente é
 * `.tsx`, e as duas decisões que valem teste moram aqui — o que é editável, e
 * como o critério se reconstrói a partir de um texto novo.
 */

export type RegraNaTela = {
  id: string;
  criterio: Criterio;
  /** O texto que ela procura, do jeito que está gravado. */
  texto: string;
  categoriaId: string;
  categoriaNome: string;
  categoriaEmoji: string;
  poteNome: string;
  poteCor: string;
  prioridade: number;
  origem: "seed" | "correcao";
  /**
   * Quantos lançamentos vieram dela.
   *
   * É a parte que transforma uma lista de textos numa lista de consequências.
   * Zero é suspeito — ou o texto está errado, ou ela nunca foi usada; 8 é onde
   * pensar duas vezes antes de mexer.
   */
  jaClassificou: number;
};

/**
 * Os três tipos do MVP não são simétricos: `descricao_contem` tem termo,
 * `pessoa` tem nome, e `valor_direcao` tem uma faixa — `textoDoCriterio`
 * devolve a direção para o terceiro, que não é editável como texto.
 *
 * Nenhuma regra desse tipo existe hoje (nem o seed nem a D5 criam). A tela
 * oferece o campo só onde ele significa alguma coisa, em vez de inventar um
 * que gravaria lixo.
 */
export function textoEhEditavel(criterio: Criterio): boolean {
  return criterio.tipo === "descricao_contem" || criterio.tipo === "pessoa";
}

/**
 * O critério com o texto trocado, **preservando o resto**.
 *
 * ⚠ A `direcao` de uma regra `pessoa` tem de sobreviver à edição do nome. Duas
 * regras do seed dependem dela: sem a direção, dinheiro que sai para a sua
 * própria conta vira renda, e uma empresa que te paga vira renda quando **você**
 * paga ela. Perder isso ao corrigir uma letra do nome seria classificar errado
 * em silêncio — o erro mais caro deste projeto.
 *
 * `null` quando o tipo não tem texto editável, ou quando o texto novo é vazio:
 * regra que procura por nada casaria com tudo.
 */
export function comTextoNovo(
  criterio: Criterio,
  texto: string,
): Criterio | null {
  const limpo = texto.trim();
  if (limpo.length === 0) return null;

  switch (criterio.tipo) {
    case "descricao_contem":
      return { ...criterio, termo: limpo };
    case "pessoa":
      return { ...criterio, nome: limpo };
    case "valor_direcao":
      return null;
  }
}

/** O rótulo humano do tipo, para a tela não mostrar `descricao_contem`. */
export function rotuloDoTipo(criterio: Criterio): string {
  switch (criterio.tipo) {
    case "descricao_contem":
      return "na descrição";
    case "pessoa":
      return "contraparte";
    case "valor_direcao":
      return "por valor";
  }
}

/**
 * O que a regra procura, em uma frase.
 *
 * A direção entra quando existe, porque ela **é** metade da regra: "recebido
 * de" e "enviado para" a mesma pessoa vão para potes diferentes.
 */
export function oQueEstaRegraProcura(criterio: Criterio): string {
  const quem =
    criterio.tipo === "pessoa" && criterio.direcao
      ? criterio.direcao === "entrada"
        ? `recebido de ${criterio.nome}`
        : `enviado para ${criterio.nome}`
      : textoDoCriterio(criterio);

  return `${quem}${frasesDaFaixa(criterio)}`;
}

/**
 * A faixa em palavras: `, de exatamente R$ 300,00`, `, de R$ 200,00 ou mais`.
 *
 * ⚠ **Ela não pode ficar de fora.** Uma regra `pessoa: Davi Lucas` restrita a
 * R$ 300,00 apareceria na `/regras` idêntica a uma sem restrição, e as duas
 * conviveriam na lista sem nada distinguindo uma da outra — você editaria a
 * errada. A restrição faz parte do que a regra procura, então entra na frase
 * que diz o que ela procura.
 *
 * Vazio para `valor_direcao`, onde a faixa **é** a regra e `textoDoCriterio`
 * já devolve a direção: "saida, de R$ 200,00 ou mais" repetiria em prosa o que
 * a própria tela mostra no rótulo do tipo.
 */
function frasesDaFaixa(criterio: Criterio): string {
  if (criterio.tipo === "valor_direcao") return "";

  const { minimoCentavos: min, maximoCentavos: max } = criterio;

  if (min !== undefined && min === max)
    return `, de exatamente ${emReais(min)}`;
  if (min !== undefined && max !== undefined) {
    return `, entre ${emReais(min)} e ${emReais(max)}`;
  }
  if (min !== undefined) return `, de ${emReais(min)} ou mais`;
  if (max !== undefined) return `, de até ${emReais(max)}`;

  return "";
}
