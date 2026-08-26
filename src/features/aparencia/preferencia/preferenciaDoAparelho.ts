/**
 * O mecanismo de uma preferência do aparelho (spec 10, tarefa B1).
 *
 * ## O que mora aqui, e o que **não** mora
 *
 * Duas preferências existem hoje — o tema (spec 08) e o tamanho da letra (spec
 * 10) — e as duas têm o mesmo esqueleto: uma lista de valores, um padrão, um
 * cookie, e uma função que limpa o que o navegador mandou. A regra deste projeto
 * é que o escrito duas vezes ganha arquivo.
 *
 * ⚠ **Mas o corte não é "tudo que se parece".** O que se repete aqui é o
 * **mecanismo**; o que fica em `tema.ts` e `letra.ts` é a **decisão** — qual é a
 * lista, qual é o padrão e por quê. Um módulo genérico que engolisse as duas
 * coisas economizaria umas quinze linhas e não teria onde guardar os parágrafos
 * que explicam por que o padrão do tema é escuro. É para esses parágrafos que
 * este projeto escreve comentário.
 *
 * ## Por que este arquivo é puro, e o `gravarPreferencia` é outro
 *
 * `letra.ts` e `tema.ts` são importados por componente cliente — o seletor
 * precisa da lista e dos rótulos. Um `import "server-only"` aqui subiria por
 * essa cadeia e quebraria os dois seletores. A gravação, que precisa de
 * `next/headers`, mora em `gravarPreferencia.ts` justamente para poder ser
 * marcada como servidor sem arrastar ninguém junto.
 */

/**
 * Um ano.
 *
 * ⚠ **Preferência do aparelho não é sessão.** Validade longa de propósito: uma
 * preferência que expira junto com o login é uma preferência que se perde toda
 * vez que a pessoa volta — e este app se abre uma vez por mês.
 */
export const VALIDADE_DO_COOKIE_SEG = 60 * 60 * 24 * 365;

/**
 * O que veio no cookie → um dos valores da lista, ou o padrão.
 *
 * ⚠ **Cookie é texto que o usuário controla, e valor desconhecido não é erro.**
 * `tema=roxo` cai no padrão sem exceção e sem log: quase sempre é um valor
 * gravado por uma versão anterior do app, não um ataque. Reclamar disso encheria
 * o log de produção com o histórico das nossas próprias mudanças.
 *
 * ⚠ **Lançar aqui derrubaria a página por causa de um cookie velho.** É a razão
 * de a função devolver o padrão em vez de sinalizar falha: não existe nada que a
 * tela pudesse fazer com a informação de que o cookie estava estranho.
 *
 * Perdoa caixa e espaço porque não custa nada e porque um `Claro` gravado à mão
 * numa sessão de depuração não deveria virar um tema diferente.
 */
export function escolhaValida<T extends string>(
  valores: readonly T[],
  padrao: T,
  valor: string | undefined | null,
): T {
  if (valor === undefined || valor === null) return padrao;

  const limpo = valor.trim().toLowerCase();

  return (valores as readonly string[]).includes(limpo) ? (limpo as T) : padrao;
}
