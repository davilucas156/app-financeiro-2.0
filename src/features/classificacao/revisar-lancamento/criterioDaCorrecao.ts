import { pessoaDe } from "@/features/classificacao/motor/pessoa";
import type { Criterio } from "@/features/classificacao/motor/regras";
import { trechoEstavel } from "@/features/classificacao/motor/trecho";
import type { Origem } from "@/features/upload/ler-arquivo/formatos";

/**
 * O critério que uma correção sua vira (tarefa D5).
 *
 * ## Por que isto existe num arquivo só
 *
 * Dois lugares precisam da mesma resposta:
 *
 * - a **tela**, que mostra "a regra vai procurar por X" antes de você confirmar;
 * - o **serviço**, que grava a regra quando você confirma.
 *
 * Eu tinha escrito os dois separados, e é exatamente o tipo de duplicação que
 * este projeto evita em toda parte: se divergirem, a tela mostra um texto e o
 * banco guarda outro. Você aprovaria uma regra e receberia outra — o pior erro
 * possível numa pergunta cuja única função é te deixar conferir.
 */

/**
 * Numa transferência o que identifica é **quem** (A3); no cartão é o trecho
 * estável (A2).
 *
 * `null` quando não há nada estável — e aí não nasce regra nenhuma, que é
 * melhor do que nascer uma que pegue o que não deve.
 */
export function criterioDaCorrecao(
  descricao: string,
  origem: Origem,
): Criterio | null {
  const pessoa = pessoaDe(descricao);
  if (pessoa) return { tipo: "pessoa", nome: pessoa };

  const trecho = trechoEstavel(descricao, origem);
  return trecho ? { tipo: "descricao_contem", termo: trecho } : null;
}

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
 * (C1), na mesma forma que a A5 usa no seed.
 *
 * É o que impede o seed e a correção de criarem duas regras para a mesma coisa.
 */
export function chaveDoCriterio(criterio: Criterio): string {
  return `${criterio.tipo}:${textoDoCriterio(criterio)}`;
}
