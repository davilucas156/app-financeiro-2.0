/**
 * A régua do valor alto, num lugar só.
 *
 * Estava escrita duas vezes — na importação (`classificarImportacao.ts`) e na
 * decisão "sempre classificar assim" (`decidirLancamento.service.ts`) — com o
 * número compartilhado e o texto copiado. Cada cópia divergiria no dia em que
 * alguém ajustasse só a sua.
 */

/**
 * R$ 200 — do `readme.md`, seção 7, e é o número que o painel usa hoje.
 *
 * Uma regra errada num valor alto é o erro mais caro que existe aqui, e é o
 * mais fácil de não notar: some no meio de trinta lançamentos certos.
 */
export const VALOR_ALTO_CENTAVOS = 20_000;

/** O mesmo texto que a tela de revisão mostra: são a mesma coisa. */
export const MOTIVO_VALOR_ALTO =
  "valor alto — confira se a categoria está certa";

export function ehValorAlto(valorCentavos: number): boolean {
  return valorCentavos >= VALOR_ALTO_CENTAVOS;
}

/**
 * Status e motivo de um lançamento **classificado por regra**: o valor alto
 * fica com a categoria gravada, mas pede confirmação.
 */
export function statusDoValor(valorCentavos: number): {
  status: "importado" | "revisao_pendente";
  motivo: string | null;
} {
  return ehValorAlto(valorCentavos)
    ? { status: "revisao_pendente", motivo: MOTIVO_VALOR_ALTO }
    : { status: "importado", motivo: null };
}
