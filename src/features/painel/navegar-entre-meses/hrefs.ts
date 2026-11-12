/**
 * Os endereços das duas telas de abas.
 *
 * Ficam num lugar só porque o `/dashboard?mes=` e o `/comparativo?ano=` são
 * usados em mais de um componente, e um deles mudando de forma sem os outros
 * acompanharem quebraria a navegação sem erro nenhum.
 */

/** O painel de um mês (`mes` no formato da conta, ex.: `2026-08`). */
export function hrefDoMes(mes: string): string {
  return `/dashboard?mes=${mes}`;
}

/** O comparativo de um ano. Aceita número ou texto, como a rota recebe. */
export function hrefDoComparativo(ano: string | number): string {
  return `/comparativo?ano=${ano}`;
}
