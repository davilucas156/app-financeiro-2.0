/**
 * As duas cores de fundo que **não** passam pelo CSS.
 *
 * A moldura que o sistema desenha em volta do app instalado (`themeColor` do
 * viewport, `theme_color` e `background_color` do manifesto) e o texto sobre o
 * botão primário do Clerk são decididos fora da cascata, como hex: nenhum deles
 * entende `var(--color-bg)`.
 *
 * ⚠ **Estes valores espelham `--color-bg` (escuro) e `--claro-bg` (claro) de
 * `src/app/globals.css`, que é a fonte da verdade.** Ao mudar o fundo lá, mude
 * aqui — `coresDoSistema.test.ts` lê o CSS e reprova se os dois divergirem,
 * para a barra do sistema não ficar de uma cor e o app de outra.
 */

/** Espelha `--color-bg` de `globals.css`. */
export const FUNDO_ESCURO = "#060608";

/** Espelha `--claro-bg` de `globals.css`. */
export const FUNDO_CLARO = "#eeeef3";
