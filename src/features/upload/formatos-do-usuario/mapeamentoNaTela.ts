import type { Papel } from "@/features/upload/ler-arquivo/formatos";

/**
 * O que o painel de mapeamento decide fora do JSX — puro e num `.ts` de
 * propósito, porque o Vitest só olha `.ts`.
 */

/** Troca a coluna de um papel; `undefined` desfaz a escolha. Não muda o original. */
export function comColuna(
  colunas: Partial<Record<Papel, number>>,
  papel: Papel,
  i: number | undefined,
): Partial<Record<Papel, number>> {
  const novo = { ...colunas };
  if (i === undefined) delete novo[papel];
  else novo[papel] = i;
  return novo;
}

const ROTULO_DO_SEPARADOR: Record<string, string> = {
  ";": "; ponto e vírgula",
  ",": ", vírgula",
  "\t": "tabulação",
  "|": "| barra",
};

/**
 * Um separador novo em `SEPARADORES_VALIDOS` aparece com o próprio caractere,
 * e não com o nome de outro.
 */
export function rotuloDoSeparador(s: string): string {
  return ROTULO_DO_SEPARADOR[s] ?? s;
}

export function sugerirNome(origem: string): string {
  return origem === "csv_cartao" ? "Fatura do cartão" : "Extrato da conta";
}
