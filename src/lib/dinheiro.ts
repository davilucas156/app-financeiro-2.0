/**
 * Centavos inteiros → `R$ 1.234,56`.
 *
 * ⚠ **Nunca divide por 100 em ponto flutuante.** `129990 / 100` é seguro, mas
 * `(129990 / 100).toFixed(2)` já passou por um double, e o mesmo tipo de conta
 * que fez `19.90 * 100` virar `1989.9999999999998` na leitura do extrato erra
 * aqui na direção contrária. Parte inteira e centavos saem de `Math.floor` e
 * `%`, que em inteiro são exatos.
 *
 * ⚠ **Sem `Intl.NumberFormat`.** Ele resolveria isto em uma linha, mas o
 * resultado depende dos dados de locale do runtime, e o servidor da Vercel e o
 * celular do Davi não têm por que concordar. Aqui a saída é a mesma em todo
 * lugar, e é a única do produto: pt-BR, ponto no milhar, vírgula no centavo.
 */
export function emReais(centavos: number): string {
  const inteiro = Math.trunc(centavos);
  const negativo = inteiro < 0;
  const absoluto = Math.abs(inteiro);

  const reais = Math.floor(absoluto / 100);
  const resto = absoluto % 100;

  const comMilhar = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${negativo ? "−" : ""}R$ ${comMilhar},${String(resto).padStart(2, "0")}`;
}

/** `"2026-06-27"` → `"27/06"`. O ano fica no cabeçalho do mês. */
export function diaEMes(data: string): string {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}
