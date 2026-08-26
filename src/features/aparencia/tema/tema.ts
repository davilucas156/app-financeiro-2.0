import { escolhaValida } from "@/features/aparencia/preferencia/preferenciaDoAparelho";

/**
 * A preferência de tema, como valor (tarefa A2 da spec 08).
 *
 * ## Por que é um arquivo, e um só
 *
 * Três lugares precisam da mesma resposta: a moldura da raiz, que carimba o
 * atributo no `<html>`; a tela de configurações, que marca a opção escolhida; e
 * a action, que grava. Escrita três vezes, ela diverge — é a mesma regra que
 * criou `chaveDaRegra.ts` na spec 03 e `lib/mes.ts` na 06.
 *
 * ## O que saiu daqui na spec 10
 *
 * A validade do cookie e a limpeza do valor foram para
 * `preferencia/preferenciaDoAparelho.ts` quando a segunda preferência do
 * aparelho chegou. ⚠ **O que ficou é o que é decisão deste tema** — os três
 * valores, o padrão escuro, os rótulos —, e é exatamente o que não caberia num
 * módulo genérico: os parágrafos abaixo não teriam onde morar lá.
 */

export const TEMAS = ["escuro", "claro", "sistema"] as const;

export type Tema = (typeof TEMAS)[number];

/**
 * O tema depois de resolvido: "sistema" não é um visual, é um adiamento.
 *
 * ⚠ **Quem resolve "sistema" é o CSS**, por `prefers-color-scheme`, e não o
 * servidor — que não tem como saber a configuração do aparelho de quem pediu a
 * página. O tipo existe para os poucos lugares onde a resposta precisa chegar
 * como valor, e não como cascata: a cor do pote (A3) e o objeto de aparência do
 * Clerk (descoberta 4).
 */
export type TemaEfetivo = "escuro" | "claro";

/**
 * ⚠ **O padrão é escuro, e isso é decisão** (pendência 3 da spec 08).
 *
 * "Seguir o sistema" pareceria o natural. Mas hoje **todo mundo está no
 * escuro**, e a maioria dos celulares está configurada em claro: subir com
 * `sistema` como padrão viraria o app do Davi para branco no primeiro deploy,
 * sem ele ter pedido nada. Mudança de aparência que ninguém pediu se lê como
 * defeito, não como funcionalidade.
 */
export const TEMA_PADRAO: Tema = "escuro";

export const COOKIE_DO_TEMA = "tema";

/**
 * O que veio no cookie → um dos três temas.
 *
 * ⚠ **O corpo saiu daqui na spec 10, e o significado não.** Quando a segunda
 * preferência do aparelho chegou, a limpeza do cookie passou a ser escrita duas
 * vezes — e neste projeto o escrito duas vezes ganha arquivo. O mecanismo mora
 * em `preferencia/preferenciaDoAparelho.ts`, junto do porquê de valor
 * desconhecido não virar log.
 *
 * **A função continua existindo mesmo tendo uma linha**, porque é ela que os
 * três lugares chamam. Trocá-la por `escolhaValida(TEMAS, TEMA_PADRAO, …)` em
 * cada um deles é o caminho para um deles esquecer a lista ou o padrão.
 */
export function temaEscolhido(valor: string | undefined | null): Tema {
  return escolhaValida(TEMAS, TEMA_PADRAO, valor);
}

export const ROTULOS_DO_TEMA: Record<Tema, { titulo: string; nota: string }> = {
  escuro: { titulo: "Escuro", nota: "O padrão do app." },
  claro: { titulo: "Claro", nota: "Para ler de dia, na rua." },
  sistema: {
    titulo: "Seguir o sistema",
    nota: "Acompanha o ajuste do aparelho.",
  },
};
