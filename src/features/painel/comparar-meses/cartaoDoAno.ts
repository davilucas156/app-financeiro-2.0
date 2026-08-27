import type { LinhaDoComparativo, ValorNoMes } from "./comparativo";

/**
 * Os cartões de topo do comparativo anual (spec 12, tarefa A2).
 *
 * ## A spec 06 adiou isto supondo uma consulta que não existe
 *
 * Ela disse que os cartões do painel estático eram _"agregados por **categoria**
 * e por **ano**"_ enquanto o histórico era por pote — e por isso "seriam outra
 * consulta". Conferindo os seis, **cinco são potes**, e os emojis batem um a um
 * com o `potes-padrao.ts`: 📈 Liberdade Financeira, ★ Metas / Sonhos, 🏠 Custos
 * Fixos, 🎮 Conforto & Lazer, 🔧 Manutenção. Só ⛽ Gasolina era categoria, e é
 * justamente o que ficou de fora (pendência 4).
 *
 * ## Nasce da linha, e não do histórico
 *
 * ⚠ **A entrada é `comparativo.linhas` — o mesmo array que as barras desenham.**
 * O rascunho tinha esta função lendo o histórico de novo, o que criaria duas
 * contas do mesmo número. Este projeto já sabe como isso acaba: é a razão de
 * `mediaDoComparativo` ter virado export na spec 09, com o motivo escrito lá —
 * duas contas divergem, e quem lê não tem como saber qual mentiu.
 *
 * Lendo a linha, cartão e barra **não podem divergir por construção**. É o que
 * o teste da E1 guarda: não uma coincidência, mas a estrutura.
 *
 * ## Não escolhe entre total e média
 *
 * O painel estático decidia caso a caso — acumulado para Investido, Metas e
 * Manutenção; média para Custos Fixos, Lazer e Gasolina. Procurei a regra e ela
 * não fecha: Investimento e Metas são tão mensais quanto Custos Fixos, e
 * cairiam do lado errado de qualquer critério por frequência.
 *
 * Os dois números saem da mesma soma, então não é preciso escolher. O cartão
 * mostra os dois, e some a pergunta "por que este é média e aquele é total?".
 */

export type CartaoDoAno = {
  poteId: string;
  /**
   * A soma do ano.
   *
   * ⚠ Inclui mês pouco classificado, porque ele existe. O que a tela faz é
   * **marcá-lo** — ver `temMesPoucoClassificado`.
   */
  totalCentavos: number;
  /** `null` quando o ano não tem mês nenhum. */
  mediaMensalCentavos: number | null;
  /**
   * Sobre quantos meses a média está falando.
   *
   * ⚠ **Nunca 12.** Dividir por doze num ano com cinco meses importados daria um
   * número que não descreve mês nenhum e que **muda sozinho** conforme o ano
   * avança. É a mesma disciplina da `mediaDoComparativo`, que nunca omite o
   * tamanho da amostra de que está falando.
   */
  mesesComDado: number;
  /** A mesma série da barra, para a linha mês a mês do cartão. */
  serie: ValorNoMes[];
  /** Autoriza a tela a marcar o cartão. Ver `totalCentavos`. */
  temMesPoucoClassificado: boolean;
};

export function cartoesDoAno(linhas: LinhaDoComparativo[]): CartaoDoAno[] {
  return linhas.map((linha) => {
    const total = linha.serie.reduce((soma, v) => soma + v.totalCentavos, 0);

    return {
      poteId: linha.poteId,
      totalCentavos: total,
      /*
       * ⚠ **Arredonda uma vez, aqui.** Centavos são inteiros no projeto inteiro;
       * deixar a fração escapar faria `emReais` receber `12345.6666`.
       *
       * ⚠ **E divide pelo total de meses da série, inclusive os pouco
       * classificados.** Tirá-los da média mas deixá-los no total faria
       * `total ÷ meses ≠ média` — o cartão se contradiria na própria face.
       */
      mediaMensalCentavos:
        linha.serie.length === 0
          ? null
          : Math.round(total / linha.serie.length),
      mesesComDado: linha.serie.length,
      serie: linha.serie,
      temMesPoucoClassificado: linha.serie.some((v) => !v.confiavel),
    };
  });
}
