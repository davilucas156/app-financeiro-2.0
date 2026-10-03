import type { Origem } from "@/features/upload/ler-arquivo/formatos";

/**
 * Em que mês cada lançamento conta.
 *
 * Pura, e num `.ts` que o Vitest alcança, pelo mesmo motivo da `somarOMes`:
 * **o erro aqui não tem sintoma.** Nada estoura, nada fica vermelho — um
 * lançamento aparece no mês vizinho, e o painel, o comparativo e a média do ano
 * ficam todos plausíveis e todos errados.
 *
 * ## Três regras, porque são três fatos diferentes
 *
 * | Linha | Mês |
 * | --- | --- |
 * | Extrato da conta | mês da **data** |
 * | Cartão, à vista | mês da **data da compra** |
 * | Cartão, parcela | mês da **fatura** |
 *
 * **Conta pela data.** O extrato do Inter vai de dia 2 a dia 2 — o arquivo de
 * `02/06 a 02/07` traz lançamentos de julho. Empurrá-los para junho seria
 * mentir sobre quando o dinheiro se moveu, e quebraria a conferência contra o
 * extrato do banco, que é a única régua externa que este app tem.
 *
 * ## ⚠ A compra à vista do cartão era o mês da fatura, e estava errada
 *
 * Toda linha da fatura ia para o mês escolhido na tela. Parecia inofensivo até
 * a medição do Davi: a fatura que vence em **outubro** traz compras de mais ou
 * menos 25/08 a 24/09, então **as saídas de setembro apareciam em outubro** —
 * e a aba de outubro, que só tinha a fatura e os dois dias de conta da ponta do
 * extrato de setembro, ficava com entrada `R$ 0,00`. O mês inteiro parecia um
 * mês sem renda e com gasto alheio.
 *
 * A compra à vista tem uma data, ela é verdadeira, e é a data em que você
 * decidiu gastar. Não havia razão para descartá-la.
 *
 * ## ⚠ A parcela continua no mês da fatura, e isto **não** é inconsistência
 *
 * A `data` de uma parcela é a data da **compra original**, não a da cobrança.
 * Uma `4/12` comprada em março chega na fatura de hoje: pelo mês da data, ela
 * cairia em março — e março, que você já fechou e já olhou, mudaria de total a
 * cada fatura nova que chegasse pelo resto do ano. Doze vezes, para a mesma
 * compra.
 *
 * O que cada fatura cobra é **uma** parcela, e ela sai do seu bolso no mês
 * daquela fatura. Esse é o mês em que o dinheiro se move — a mesma régua que
 * manda a compra à vista para a data dela manda a parcela para a fatura.
 *
 * Em nenhum dos três casos a `data` é perdida: ela fica na coluna, e qualquer
 * outra leitura continua possível depois sem migration — foi essa promessa,
 * escrita quando a regra antiga foi feita, que permitiu consertá-la agora.
 */
export function mesDoLancamento(
  lancamento: {
    origem: Origem;
    /** `YYYY-MM-DD`. No cartão parcelado, a data da **compra**. */
    data: string;
    /** `"4/12"` quando parcelado; `null` à vista ou fora do cartão. */
    parcela: string | null;
  },
  /** `YYYY-MM` — o mês que o usuário escolheu ao enviar a fatura. */
  mesDaFatura: string,
): string {
  if (lancamento.origem === "csv_cartao" && lancamento.parcela !== null) {
    return mesDaFatura;
  }

  return lancamento.data.slice(0, 7);
}
