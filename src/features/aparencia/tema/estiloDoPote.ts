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
 * Então ela devolve as duas e deixa a escolha para o CSS. O elemento carrega
 * `--pote-escuro` e `--pote-claro`; `--cor-do-pote`, definida em `globals.css`,
 * aponta para uma delas conforme o tema, e o `background-color` lê essa. A
 * substituição acontece **no elemento**, que é onde as duas cores existem.
 *
 * ⚠ **Mudar o nome de qualquer uma das três variáveis quebra em silêncio.** Uma
 * `var()` que não resolve não derruba nada: ela simplesmente não pinta, e a
 * barra fica transparente. O par está em `globals.css`, na seção do tema claro.
 */
export function estiloDoPote(cor: string): CSSProperties {
  return {
    "--pote-escuro": cor,
    "--pote-claro": corParaFundoClaro(cor),
    backgroundColor: "var(--cor-do-pote)",
  } as CSSProperties;
}
