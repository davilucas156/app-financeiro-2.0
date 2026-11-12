import { anoDoMes } from "@/lib/mes";
import type { LinhaDoComparativo } from "./comparativo";

/**
 * A matemática das barras do comparativo, fora do componente.
 *
 * ⚠ **Vive num `.ts` puro de propósito.** Dentro do `SecaoDoComparativo.tsx` ela
 * não tinha teste nenhum: a escala e a contagem de anos decidem o que a tela
 * mostra, e um erro aqui só apareceria olhando a tela.
 *
 * Todas as barras se medem contra o mesmo teto (o maior valor da seção
 * inteira), e é por isso que a função recebe `teto` e não calcula o próprio.
 */

/**
 * A largura de uma barra, em porcentagem inteira de 0 a 100.
 *
 * Teto zero devolve 0 (não há o que medir), e o valor é travado em 0–100: a
 * média pode passar do maior mês e a barra tracejada não pode sair do trilho.
 */
export function larguraEmPct(valor: number, teto: number): number {
  if (teto === 0) return 0;

  const pct = Math.round((valor / teto) * 100);

  return Math.max(0, Math.min(100, pct));
}

/** O maior valor de todas as linhas, contando a média de cada uma. */
export function maiorValorDaTela(linhas: LinhaDoComparativo[]): number {
  let maior = 0;

  for (const linha of linhas) {
    for (const valor of linha.serie) {
      if (valor.totalCentavos > maior) maior = valor.totalCentavos;
    }
    if (linha.mediaCentavos !== null && linha.mediaCentavos > maior) {
      maior = linha.mediaCentavos;
    }
  }

  return maior;
}

/** Quantos anos diferentes aparecem nas séries. Mais de um → o ano vai na etiqueta. */
export function anosDaSerie(linhas: LinhaDoComparativo[]): number {
  const vistos = new Set(
    linhas.flatMap((l) => l.serie.map((v) => anoDoMes(v.mes))),
  );

  return vistos.size;
}

/** O mês mais recente da série de uma linha, ou `undefined` se a série estiver vazia. */
export function ultimoMesDaLinha(
  linha: LinhaDoComparativo,
): string | undefined {
  return linha.serie.at(-1)?.mes;
}
