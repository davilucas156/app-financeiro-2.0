/**
 * O que a tela sabe sobre o "Voltar" (tarefa D6).
 *
 * Puro, e num arquivo próprio pela mesma razão de `pendentes.ts`: o serviço é
 * `server-only`, o botão é componente de cliente, e o texto do aviso é a única
 * parte disto que tem decisão dentro — logo é a parte que precisa de teste.
 */

/** A sombra da última decisão, do jeito que a tela precisa vê-la. */
export type PodeVoltar = {
  /** A descrição do lançamento que vai reabrir. */
  descricao: string;
  /** Aquela decisão criou uma regra? */
  regraCriada: boolean;
  /** Quantos irmãos a regra pegou junto. */
  irmaos: number;
};

/**
 * O aviso que aparece **antes** de tocar em "Voltar".
 *
 * ## Por que ele existe
 *
 * Desfazer reabre **um** lançamento. Se aquela decisão criou uma regra, a regra
 * fica, e os irmãos que ela pegou seguem classificados — é o que a D6 manda
 * ("desfazer uma classificação não é desfazer o aprendizado"), e é
 * surpreendente se ninguém disser.
 *
 * Avisar depois seria explicar um susto. Avisar antes é informação.
 *
 * ## Por que ele some quando não há regra
 *
 * Decisão sem regra desfaz inteira, sem sobra. Um aviso ali não explicaria
 * nada — só gastaria a atenção que o aviso de verdade vai precisar.
 */
export function avisoDoVoltar(voltar: PodeVoltar | null): string | null {
  if (!voltar || !voltar.regraCriada) return null;

  if (voltar.irmaos === 0) {
    return "Voltar reabre o lançamento anterior. A regra que você criou continua valendo.";
  }

  const outros =
    voltar.irmaos === 1
      ? "o outro que ela pegou segue classificado"
      : `os outros ${voltar.irmaos} que ela pegou seguem classificados`;

  return `Voltar reabre o lançamento anterior. A regra que você criou continua valendo, e ${outros}.`;
}
