import type { SomaDoMes } from "./somarOMes";

/**
 * Quanto do dinheiro do mês estes números cobrem (tarefa A2).
 *
 * ## Por que a contagem de pendentes não servia
 *
 * O `/dashboard` da D8 diz "32 para decidir". Isso conta lançamentos, e
 * lançamento não é dinheiro: uma assinatura de R$ 20 e um aporte contam igual.
 *
 * Medido contra o extrato real do Davi: 32 pendentes de 33 lançamentos eram
 * **37% do dinheiro que saiu**, e um único lançamento respondia por metade de
 * um pote inteiro. Os dois números descrevem o mesmo mês e contam histórias
 * diferentes — e é a versão em dinheiro que diz se dá para confiar na tela.
 */

export type Cobertura = {
  /**
   * 0 a 100, ou `null` quando não houve dinheiro naquela direção.
   *
   * `null` e não `100`: "100% de nada" é uma frase que parece uma garantia e
   * não é nenhuma. A tela decide o que dizer quando não há o que cobrir.
   */
  saiuPct: number | null;
  entrouPct: number | null;
  /** Todo o dinheiro do mês caiu num pote. */
  completa: boolean;
};

export function coberturaDoMes(soma: SomaDoMes): Cobertura {
  return {
    saiuPct: porcentagemDaCobertura(
      soma.saiuClassificadoCentavos,
      soma.saiuCentavos,
    ),
    entrouPct: porcentagemDaCobertura(
      soma.entrouClassificadoCentavos,
      soma.entrouCentavos,
    ),
    /*
     * ⚠ **Vem da comparação crua, nunca da porcentagem.**
     *
     * Com 99,6% classificado, um arredondamento normal daria 100 — e a tela
     * diria "completo" com dinheiro de fora. A pergunta "sobrou alguma coisa?"
     * é sobre centavos, não sobre o número que aparece.
     */
    completa:
      soma.saiuClassificadoCentavos === soma.saiuCentavos &&
      soma.entrouClassificadoCentavos === soma.entrouCentavos,
  };
}

/**
 * ⚠ **Arredonda para baixo, e nunca chega a 100 sem estar completo.**
 *
 * 99,6% mostra 99. É a mesma régua do `completa` acima: a tela não pode
 * anunciar o fim do trabalho enquanto sobrar dinheiro.
 *
 * E o outro lado: com 0,4% classificado mostra **1**, não 0. Dizer "0%" quando
 * já existe algo classificado é a mesma mentira invertida — e "1%" é feio o
 * suficiente para ser honesto.
 *
 * ⚠ **Exportada por causa da C1 da spec 06.** O histórico calcula a cobertura de
 * cada mês fora do `coberturaDoMes`, e um segundo arredondamento faria um mês em
 * 89,6% entrar na média do comparativo e ser mandado para revisão pelo painel —
 * a mesma tela discordando de si mesma sobre o mesmo mês.
 */
export function porcentagemDaCobertura(
  parte: number,
  todo: number,
): number | null {
  if (todo === 0) return null;
  if (parte >= todo) return 100;
  // Nada classificado é 0 de verdade. A trava abaixo é só contra o
  // arredondamento, não contra o zero.
  if (parte <= 0) return 0;

  return Math.max(1, Math.floor((parte / todo) * 100));
}

/**
 * A partir de quanto os números do mês sustentam uma frase (tarefa A1).
 *
 * ⚠ **Chute honesto, e nomeado para ser corrigido.** Não saiu de dados: há um
 * mês fechado no banco. Quando houver mais, é aqui que se mexe — e mexer aqui
 * muda o veredito e o comparativo ao mesmo tempo, que é exatamente o ponto.
 */
export const COBERTURA_CONFIAVEL_PCT = 90;

/**
 * Dá para dizer alguma coisa sobre este mês?
 *
 * ## Mora aqui, e não no veredito, de propósito
 *
 * Duas perguntas do projeto são esta mesma pergunta: o degrau 1 do
 * `vereditoDoMes` ("mande revisar antes de opinar") e o corte da média do
 * `compararMeses` ("mês mal classificado não entra na média"). Escritas em dois
 * arquivos, elas divergiriam no primeiro ajuste — e o app passaria a mandar
 * revisar um mês que ele próprio aceitou como régua.
 *
 * ⚠ **Só `saiuPct`.** A entrada é outro assunto: a medição da spec 04 achou
 * cobertura muito menor no que entra do que no que sai, e a assimetria é
 * estrutural — renda quase não é classificada. O veredito não fala de renda
 * classificada; fala de renda **declarada**. Exigir cobertura de entrada
 * travaria todo mês no degrau 1, para sempre.
 *
 * ⚠ **`saiuPct === null` devolve `false`, e isso não quer dizer "ruim".**
 * Quer dizer que não saiu dinheiro nenhum — um mês sem gasto não é um mês mal
 * classificado. Quem sabe o que fazer com ele é quem chamou: o `vereditoDoMes`
 * se cala antes de chegar aqui.
 */
export function coberturaConfiavel(cobertura: Cobertura): boolean {
  return (
    cobertura.saiuPct !== null && cobertura.saiuPct >= COBERTURA_CONFIAVEL_PCT
  );
}
