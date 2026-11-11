/**
 * `Tipo do evento: "conteúdo"` — o formato em que o extrato escreve Pix e
 * outras transferências de conta (ex.: `Pix enviado: "Cp :00000000-Fulana"`).
 *
 * `pessoa.ts` (A3) e `trecho.ts` (A2) precisavam do mesmo recorte e cada um
 * tinha sua própria cópia da regex, byte a byte — divergiriam em silêncio se
 * o formato do evento mudasse um dia (rodada 12 da revisão de arquitetura).
 */
const EVENTO_DA_CONTA = /^([^:]+):\s*"(.*)"\s*$/;

/** O conteúdo entre aspas, ou o texto inteiro quando não é desse formato. */
export function conteudoDoEvento(texto: string): string {
  const evento = EVENTO_DA_CONTA.exec(texto);
  return (evento ? evento[2] : texto).trim();
}
