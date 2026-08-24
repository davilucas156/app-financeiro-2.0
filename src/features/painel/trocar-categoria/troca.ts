/**
 * O que a tela sabe antes de trocar a categoria (tarefa D4).
 *
 * Puro, e num `.ts` de propósito: o componente é `.tsx` e o Vitest só olha
 * `.ts`. A decisão que vale teste é o que a tela diz **antes** de você escolher
 * — mesma razão de `avisoDoVoltar` morar em `desfazer.ts`.
 */

/**
 * O aviso que aparece com a lista aberta, antes da escolha.
 *
 * ## Por que ele existe
 *
 * Trocar a categoria limpa `regra_id` e `regra_chave` do lançamento: a
 * procedência da C3 passa a ser você, porque passou a ser.
 *
 * **A regra em si não é tocada.** Ela segue lá e vai classificar o próximo
 * extrato do mesmo jeito. Quem corrige um lançamento que veio de regra
 * precisa saber disso agora, e não no mês que vem, quando o mesmo gasto cair
 * no mesmo lugar errado.
 *
 * ## Por que ele some quando a classificação foi sua
 *
 * Você escolheu à mão ou aceitou uma sugestão: não há regra nenhuma para
 * continuar valendo. Um aviso ali não explicaria nada — só gastaria a atenção
 * que o aviso de verdade vai precisar.
 */
export function avisoDaTroca(veioDeRegra: boolean): string | null {
  if (!veioDeRegra) return null;

  return "Esta veio de uma regra. Trocar aqui corrige só este lançamento — a regra continua valendo para os próximos.";
}

/**
 * ⚠ **Tocar na categoria atual não é uma decisão**, e é a armadilha desta tela.
 *
 * Abrir a lista para conferir onde o lançamento está e tocar no que já está
 * marcado gravaria uma decisão de verdade: `classificado_por` viraria
 * `manual`, `regra_chave` seria apagada, a sombra do desfazer seria
 * sobrescrita — e nada na tela mudaria de lugar.
 *
 * A procedência morreria em silêncio, num toque que a pessoa fez justamente
 * para não mudar nada. A lista marca a atual como não tocável; aqui é a mesma
 * decisão, do outro lado.
 */
export function ehTrocaDeVerdade(
  atualId: string,
  escolhidaId: string,
): boolean {
  return atualId !== escolhidaId;
}
