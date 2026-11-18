import type { FonteDeSugestao } from "@/features/classificacao/motor/sugestoes";

/**
 * O nome de cada fonte de sugestão, do jeito que o usuário lê.
 *
 * ⚠ **Mora aqui e não em `motor/sugestoes.ts`** porque aquele arquivo importa
 * `preparar` (`node:crypto`): um import de valor dele num componente cliente
 * quebraria o bundle. Este módulo é puro e só importa o **tipo** do motor, então
 * serve à tela de revisão (cliente) e ao painel (servidor).
 *
 * O `Record` é o que obriga a rotular a fonte nova: acrescentar uma fonte em
 * `FONTES_DE_SUGESTAO` sem acrescentá-la aqui falha na compilação.
 */
export const ROTULO_DA_FONTE: Record<FonteDeSugestao, string> = {
  "voce-ja-classificou": "seu histórico",
  "mesma-contraparte": "mesma pessoa",
  "categoria-do-banco": "palpite do banco",
  "pote-do-banco": "banco + histórico",
};

/** Uma palavra por fonte, curta o bastante para caber no polegar. */
export function rotuloDaFonte(fonte: FonteDeSugestao): string {
  return ROTULO_DA_FONTE[fonte];
}
