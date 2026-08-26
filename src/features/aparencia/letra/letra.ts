import { escolhaValida } from "@/features/aparencia/preferencia/preferenciaDoAparelho";

/**
 * A preferência de tamanho de letra, como valor (spec 10, tarefa B1).
 *
 * ## Por que é um arquivo, e um só
 *
 * Três lugares precisam da mesma resposta: a moldura da raiz, que carimba o
 * atributo no `<html>`; a tela de configurações, que marca a opção escolhida; e
 * a action, que grava. Escrita três vezes, ela diverge — é a mesma regra que
 * criou `tema.ts` na spec 08 e `chaveDaRegra.ts` na 03.
 *
 * ## O que este arquivo **não** tem
 *
 * A limpeza do cookie e a validade dele moram em
 * `preferencia/preferenciaDoAparelho.ts`, dividida com o tema: aquilo é
 * mecanismo. O que fica aqui é decisão — quais degraus, qual o padrão, e como
 * cada um se chama para quem lê.
 */

export const TAMANHOS = ["padrao", "grande", "maior"] as const;

export type Tamanho = (typeof TAMANHOS)[number];

/**
 * ⚠ **`"padrao"` sem acento.** Este valor vira conteúdo de cookie e valor do
 * atributo `data-letra` no `<html>`. Acento funciona nos dois e não paga o risco
 * de uma codificação diferente no caminho.
 */
export const TAMANHO_PADRAO: Tamanho = "padrao";

export const COOKIE_DA_LETRA = "letra";

/**
 * O que veio no cookie → um dos três tamanhos.
 *
 * ⚠ **Existe mesmo sendo três linhas, e é a mesma razão do `temaEscolhido`:**
 * ela é o único ponto por onde o texto do cookie passa antes de virar atributo
 * do HTML. Chamar `escolhaValida` direto nos três lugares que precisam dela é o
 * caminho para um deles esquecer.
 */
export function letraEscolhida(valor: string | undefined | null): Tamanho {
  return escolhaValida(TAMANHOS, TAMANHO_PADRAO, valor);
}

/**
 * ⚠ **A nota de cada degrau diz o que ele resolve, não quanto ele cresce.**
 * "+22%" não ajuda ninguém a escolher; "para ler sem apertar os olhos" ajuda. Os
 * números estão na spec 10, que é onde eles são decisão.
 */
export const ROTULOS_DO_TAMANHO: Record<
  Tamanho,
  { titulo: string; nota: string }
> = {
  padrao: { titulo: "Padrão", nota: "Como o app foi desenhado." },
  grande: { titulo: "Grande", nota: "Um degrau acima, sem mudar o layout." },
  maior: { titulo: "Maior", nota: "Para ler sem apertar os olhos." },
};
