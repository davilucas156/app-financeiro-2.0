import { emReais } from "@/lib/dinheiro";

/**
 * A linha de insight dentro do cartão do pote (tarefa A2).
 *
 * ## O que ela é, e o que a `legendaDoPote` continua sendo
 *
 * ⚠ **`legendaDoPote` não vira isto.** Ela é a linha embaixo da barra: curta,
 * sempre presente, e sobre o estado. Esta é outra frase — mais longa, às vezes
 * ausente, e sobre o **dinheiro**. Esticar a legenda faria um texto servir a
 * dois donos, e os dois donos mudam por motivos diferentes.
 *
 * ## Duas metades, e as duas podem faltar
 *
 * 1. **a distância da meta, em dinheiro.** É a metade que existe porque a
 *    medição achou um pote em 708% da meta: 708% não cabe numa barra, e
 *    "R$ 2.100 acima" cabe numa frase.
 * 2. **a categoria que domina**, quando passa do limiar. A medição achou
 *    concentração de 51% a 100% em todos os potes, então ela quase sempre
 *    passa — o limiar existe para o mês em que não passar, e nesse mês a frase
 *    simplesmente sai menor.
 *
 * ## Por que `estadoDoPote` não é chamado aqui
 *
 * Ele responde à barra, com cinco estados e uma ordem própria. Este arquivo tem
 * quatro recusas, e uma delas — meta calculada em zero — ele não conhece.
 * Reusá-lo amarraria a frase à barra e faria as duas mudarem juntas para
 * sempre, que é exatamente o que a tarefa proíbe para a legenda.
 */

/**
 * A partir de quanto uma categoria "domina" o pote.
 *
 * ⚠ Chute honesto, como os limiares do `veredito.ts`. Metade é o menor número
 * que sustenta a palavra: abaixo dela, apontar um protagonista seria inventar
 * um.
 */
export const CONCENTRACAO_DOMINANTE = 0.5;

export type CategoriaNoInsight = { nome: string; totalCentavos: number };

/**
 * Estrutural — `PoteNoPainel` satisfaz isto sem `import` nenhum, como
 * `CategoriaComPote` em `somarOMes.ts`.
 */
export type PoteNoInsight = {
  tipo: "gasto" | "renda";
  /** Já orientado pelo tipo do pote. */
  totalCentavos: number;
  lancamentos: number;
  categorias: CategoriaNoInsight[];
};

export function insightDoPote(
  pote: PoteNoInsight,
  meta: { metaCentavos: number | null },
): string | null {
  /*
   * ## As quatro recusas
   *
   * `metaCentavos === null` — descoberta 3: Manutenção e Outros/Repasses
   * nascem sem percentual de propósito. Não são potes que fecharam dentro; são
   * potes que não têm dentro. Silêncio é melhor do que uma frase que divide por
   * zero.
   *
   * `lancamentos === 0` — a `legendaDoPote` já diz "nada caiu aqui este mês", e
   * repetir com outras palavras é ruído.
   *
   * `totalCentavos < 0` — reembolso maior que o gasto. "R$ 400 abaixo da meta"
   * seria verdade aritmética e mentira de sentido: ninguém economizou nada.
   *
   * `metaCentavos <= 0` — renda declarada zerada. É o infinito por cento da
   * descoberta 3 chegando por outro caminho.
   */
  if (meta.metaCentavos === null) return null;
  if (meta.metaCentavos <= 0) return null;
  if (pote.lancamentos === 0) return null;
  if (pote.totalCentavos < 0) return null;

  const metades = [distanciaDaMeta(pote, meta.metaCentavos)];
  const dominante = categoriaDominante(pote);
  if (dominante !== null) metades.push(dominante);

  return metades.join(" · ");
}

/**
 * ## O pote de renda inverte o sentido, não o texto
 *
 * Num pote de gasto, acima da meta é ruim; num de renda, é bom. A frase não
 * sabe disso e não deve saber — é a régua da spec 04, **sinal e não
 * julgamento**. O que muda é só a palavra: "meta" de renda soa a cobrança, e
 * ninguém combinou de cobrar renda do Davi.
 */
function distanciaDaMeta(pote: PoteNoInsight, metaCentavos: number): string {
  const alvo = pote.tipo === "renda" ? "previsto" : "meta";
  const diferenca = pote.totalCentavos - metaCentavos;

  if (diferenca === 0) {
    return alvo === "meta" ? "Fechou exatamente na meta" : "Fechou no previsto";
  }

  const lado = diferenca > 0 ? "acima" : "abaixo";
  return `${emReais(Math.abs(diferenca))} ${lado} d${alvo === "meta" ? "a meta" : "o previsto"}`;
}

/**
 * A frase carrega **a porcentagem**, e não "mais da metade".
 *
 * "Mais da metade" é verdade para 51% e para 84%, e as duas coisas não são a
 * mesma. O limiar decide se a frase sai; o número decide o que ela diz.
 *
 * Empate fica com a primeira categoria (`>`, não `>=`): a ordem vem estável do
 * serviço, e a frase não pode oscilar entre dois renders da mesma tela.
 */
function categoriaDominante(pote: PoteNoInsight): string | null {
  if (pote.totalCentavos <= 0) return null;

  let maior: CategoriaNoInsight | null = null;
  for (const categoria of pote.categorias) {
    if (maior === null || categoria.totalCentavos > maior.totalCentavos) {
      maior = categoria;
    }
  }

  if (maior === null || maior.totalCentavos <= 0) return null;

  const fracao = maior.totalCentavos / pote.totalCentavos;
  if (fracao <= CONCENTRACAO_DOMINANTE) return null;

  /*
   * ⚠ **99,6% não vira 100%.** Mesma régua do `porcentagem` da cobertura: a
   * tela não pode dizer "tudo" enquanto sobrar dinheiro em outra categoria.
   */
  if (maior.totalCentavos >= pote.totalCentavos) {
    return `tudo em ${maior.nome}`;
  }

  return `${maior.nome} é ${Math.min(99, Math.round(fracao * 100))}% dele`;
}
