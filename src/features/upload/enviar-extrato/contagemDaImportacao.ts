/**
 * A conta do resumo da importação (tarefa D2).
 *
 * ⚠ O nome é `contagem` e não `resumo` porque `ResumoDaImportacao.tsx` mora ao
 * lado: dois arquivos diferindo só na caixa colidem em sistema de arquivos
 * que não distingue maiúscula — o `tsc` pegou.
 *
 * Puro, e num `.ts` de propósito: o componente é `.tsx` e o Vitest só olha
 * `.ts`. A composição de "para decidir" é exatamente o tipo de soma que ganha
 * uma parcela nova daqui a dois meses e ninguém percebe — mesmo movimento de
 * `exibirEnvio.ts` na spec 02.
 */

export type ContagemDaImportacao = {
  /** Lançamentos que entraram no banco. */
  importados: number;
  /** O motor bateu regra (D1). */
  classificados: number;
  /** Nenhuma regra bateu: você escolhe a categoria. */
  pendentes: number;
  /** Pares que se anulam, da spec 02. */
  pares: number;
  /** Classificados de valor alto: a regra bateu, você confirma (D1). */
  conferir: number;
  /** Pagamento de fatura e afins: entram, mas fora do cálculo. */
  excluidos: number;
};

/**
 * Quantos lançamentos **esperam por você** em `/revisao`.
 *
 * ⚠ Não é só `pendentes`. A Etapa 2 escreveu "30 classificados · 17 para
 * decidir", mas 17 é só quem não achou regra. Somam-se os pares que se anulam
 * (spec 02) e os de valor alto (D1) — todos os três caem na mesma tela.
 *
 * Mostrar 17 e mandar o usuário para uma tela com 23 é mentir por omissão,
 * que é o problema que a D6 da spec 02 acabou de consertar em duas telas.
 *
 * **Os de valor alto contam duas vezes de propósito:** eles estão em
 * `classificados` e aqui. A sobreposição é real — foram classificados **e**
 * pedem confirmação — e a tela diz isso em palavras em vez de escolher um dos
 * dois lados e esconder o outro.
 */
export function paraDecidir(c: ContagemDaImportacao): number {
  return c.pendentes + c.pares + c.conferir;
}

/** Nada pendente: a tela diz que acabou e **não** oferece link para lugar vazio. */
export function tudoResolvido(c: ContagemDaImportacao): boolean {
  return paraDecidir(c) === 0;
}
