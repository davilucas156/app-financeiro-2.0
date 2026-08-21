import type { Criterio } from "./regras";

/**
 * A identidade de um critério (tarefas C1, D5 e D7).
 *
 * ## Por que isto é do motor, e não da tela
 *
 * Nasceu em `revisar-lancamento/`, junto da pergunta "sempre classificar
 * assim?". Só que **dois lugares** produzem regra — a correção do Davi e o seed
 * da A5 — e cada um estava escrevendo a chave à sua maneira:
 *
 * - a correção: `descricao_contem:PETROBRAS`
 * - o seed: `semente:descricao_contem:PETROBRAS:transporte/gasolina`
 *
 * O `(user_id, chave)` único da C1 existe justamente para "impedir o seed e a
 * correção de criarem duas regras para a mesma coisa" — e com dois formatos ele
 * nunca disparava entre eles. Corrigir um PETROBRAS semeado criaria uma
 * **segunda** regra para PETROBRAS, com destino diferente, e qual vence sairia
 * do desempate da A1. Funcionaria por acidente, e seria impossível de explicar
 * para quem estivesse olhando a tela de regras.
 *
 * Uma função só, no motor, chamada pelos dois. Mesma lição da D5 uma camada
 * abaixo: duas implementações do mesmo texto divergem, e a divergência é
 * silenciosa.
 */

/** O texto que a tela mostra dentro do quadro amarelo. */
export function textoDoCriterio(criterio: Criterio): string {
  switch (criterio.tipo) {
    case "descricao_contem":
      return criterio.termo;
    case "pessoa":
      return criterio.nome;
    case "valor_direcao":
      return criterio.direcao;
  }
}

/**
 * `descricao_contem:PADARIA CEU AZUL BETIM` — a identidade única por usuário
 * (C1).
 *
 * ⚠ **A categoria de destino fica de fora, de propósito.** Ela dentro
 * permitiria duas regras com o mesmo critério apontando para lugares
 * diferentes — o "empate impossível de explicar" que o próprio schema da C1
 * avisa. Duas regras para o mesmo texto têm de colidir; é isso que a colisão
 * serve para dizer.
 */
export function chaveDoCriterio(criterio: Criterio): string {
  return `${criterio.tipo}:${textoDoCriterio(criterio)}`;
}
