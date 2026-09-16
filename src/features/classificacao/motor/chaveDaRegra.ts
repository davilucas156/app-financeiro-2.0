import { temFaixaDeValor, type Criterio } from "./regras";

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
  return `${criterio.tipo}:${textoDoCriterio(criterio)}${sufixoDaFaixa(criterio)}`;
}

/**
 * `@30000` para o valor exato, `@30000-50000` para a faixa, `@-50000` e
 * `@30000-` quando só um dos limites existe.
 *
 * ## Duas coisas dependem de ele ser vazio quando não há faixa
 *
 * ⚠ **As regras que já estão no banco.** Um sufixo constante mudaria a chave
 * de toda regra existente, e o `on conflict (user_id, chave)` que impede o
 * seed e a correção de duplicarem passaria a não disparar contra elas: a
 * primeira correção de cada regra antiga criaria uma **segunda** regra em vez
 * de atualizar a que existe, e qual vence sairia do desempate da A1. É o
 * "empate impossível de explicar" que este arquivo inteiro existe para evitar.
 *
 * ⚠ **A exceção precisa de chave diferente do padrão.** `Davi Lucas` e
 * `Davi Lucas + R$ 300,00` são duas regras que têm de coexistir — sem o
 * sufixo elas colidiriam no único do banco e a exceção sobrescreveria o padrão
 * calada. É o oposto exato do parágrafo acima, e as duas coisas saem da mesma
 * linha.
 *
 * De quebra conserta `valor_direcao`, cuja chave era só `valor_direcao:saida`:
 * duas faixas de valor na mesma direção nunca puderam coexistir. Nenhuma regra
 * desse tipo existe hoje — nem o seed nem a correção criam — então o conserto
 * não mexe em linha nenhuma.
 */
function sufixoDaFaixa(criterio: Criterio): string {
  if (!temFaixaDeValor(criterio)) return "";

  const { minimoCentavos: min, maximoCentavos: max } = criterio;
  if (min !== undefined && min === max) return `@${min}`;

  return `@${min ?? ""}-${max ?? ""}`;
}
