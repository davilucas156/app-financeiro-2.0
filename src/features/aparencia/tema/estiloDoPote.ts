import type { CSSProperties } from "react";
import { corParaFundoClaro } from "./corNoTema";

/**
 * O `style` de qualquer coisa pintada com a cor de um pote (tarefa D2 da
 * spec 08). São oito lugares: a faixa do cartão, as duas barras e as bolinhas
 * das telas de categoria, regras e revisão.
 *
 * ## Por que devolve duas cores e não uma
 *
 * Porque o servidor **não pode escolher**. O tema tem três estados, e um deles
 * é "seguir o sistema" — que só o navegador de quem está lendo sabe resolver.
 * Uma função que devolvesse "a cor certa" teria de adivinhar a configuração do
 * aparelho, e erraria em todo mundo que escolheu o sistema.
 *
 * Então ela devolve as duas e deixa a escolha para o CSS, com `light-dark()`,
 * que segue o `color-scheme` — e o `color-scheme` já está certo nos três
 * estados do tema (`dark` na raiz, `light` em "claro" e em "sistema" sob
 * `prefers-color-scheme: light`).
 *
 * ## ⚠ O ponteiro em `:root` não funcionava, e falhava em silêncio
 *
 * Até 30/08/2026 isto era `backgroundColor: var(--cor-do-pote)`, com
 * `--cor-do-pote: var(--pote-escuro)` declarada em `:root` no `globals.css`.
 * Parecia certo e pintava **nada**: o `var()` de uma custom property é
 * substituído **onde ela é declarada**, não onde é lida. Em `:root` não existe
 * `--pote-escuro`, então `--cor-do-pote` já computava para o valor
 * garantidamente inválido e descia assim por herança — e um
 * `background-color` inválido em tempo de valor computado vira `transparent`.
 *
 * O efeito: **a cor do pote sumiu dos oito lugares** entre a spec 08 e a
 * correção. Ninguém viu porque o único pote que continuava colorido era o
 * estourado, que é pintado por classe do Tailwind (`bg-red`) e não passa por
 * aqui.
 *
 * ⚠ **`light-dark()` foi medida e recusada na spec 08**, e a recusa **não vale
 * aqui**: o motivo lá era que `--color-green` deixaria de valer uma cor para
 * valer um par, e `bg-green/8` lê o token para montar um `color-mix`. A cor do
 * pote não é token do Tailwind, ninguém a mistura, e ela alimenta uma
 * propriedade só. Como o valor é escrito no atributo `style`, o Lightning CSS
 * nem o vê — quem resolve é o navegador.
 */
export function estiloDoPote(cor: string): CSSProperties {
  return {
    "--pote-escuro": cor,
    "--pote-claro": corParaFundoClaro(cor),
    /*
     * Resolvido **no elemento**, que é onde as duas cores existem. Claro
     * primeiro, escuro depois — é a ordem dos argumentos de `light-dark()`.
     */
    backgroundColor: "light-dark(var(--pote-claro), var(--pote-escuro))",
  } as CSSProperties;
}
