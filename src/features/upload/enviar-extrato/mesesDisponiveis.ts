import { mesDeData } from "@/lib/mes";

/** Quantos meses o seletor do upload oferece, contando o atual. */
export const JANELA_DE_MESES = 18;

/**
 * Os últimos meses até o atual. **Futuro fica de fora**: extrato de mês que
 * ainda não aconteceu não existe, e oferecer a opção só convida ao engano.
 *
 * Do mais recente para o mais antigo; o primeiro item é o mês de `hoje`.
 */
export function mesesDisponiveis(
  hoje = new Date(),
  quantos = JANELA_DE_MESES,
): string[] {
  const lista: string[] = [];

  for (let i = 0; i < quantos; i++) {
    const d = new Date(
      Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - i, 1),
    );
    lista.push(mesDeData(d));
  }

  return lista;
}
