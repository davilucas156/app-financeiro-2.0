// `@clerk/types` foi descontinuado no Core 3 e o tipo `Appearance` virou
// `ClerkAppearanceTheme`. Os tipos vêm do subpath do SDK.
import type { ClerkAppearanceTheme } from "@clerk/nextjs/types";

/**
 * Aparência dos widgets do Clerk, para eles não parecerem um enxerto de outro
 * produto dentro do painel.
 *
 * ⚠ **As cores aqui são hex literal, e isso é uma exceção consciente** à regra
 * "nenhuma cor literal em componente" (`references/architecture.md`).
 *
 * Motivo, medido em navegador real e nao suposto: o Clerk faz **calculo de
 * cor** em cima destes valores para derivar tons de hover, foco e borda. Com
 * `var(--color-card)` ele recebe uma string que o calculo nao resolve, e as
 * cores saem **transparentes** — o widget aparece, mas sem identidade
 * nenhuma. Com hex os valores chegam: o titulo renderiza em
 * `rgb(232, 232, 240)`, que e exatamente o `--color-text`.
 *
 * Os valores abaixo são os mesmos de `references/design-system.md`. Ao mudar
 * um token lá, mude aqui também — é o único lugar do projeto onde essa
 * duplicação existe, e existe porque a fronteira com o Clerk exige.
 *
 * As **fontes** continuam como `var(...)`: fonte não passa por cálculo, é
 * repassada direto para o CSS.
 *
 * Os nomes das variáveis são os do **Core 3**, que renomeou boa parte delas:
 * não existem mais `colorText`, `colorTextSecondary`, `colorInputBackground`
 * nem `colorInputText`. O par correto é `color*` / `color*Foreground`.
 */
export const APARENCIA_CLERK: ClerkAppearanceTheme = {
  variables: {
    colorBackground: "#111116", // --color-card
    colorForeground: "#e8e8f0", // --color-text

    colorPrimary: "#ff5000", // --color-primary
    colorPrimaryForeground: "#060608", // --color-bg (texto sobre o laranja)

    colorMuted: "#16161c", // --color-card2
    colorMutedForeground: "#5a5a70", // --color-dim

    colorInput: "#16161c", // --color-card2
    colorInputForeground: "#e8e8f0", // --color-text

    colorBorder: "#28282f", // --color-border2
    colorNeutral: "#5a5a70", // --color-dim

    colorDanger: "#ff4f4f", // --color-red
    colorSuccess: "#00e5a0", // --color-green
    colorWarning: "#ffc94d", // --color-gold

    fontFamily: "var(--font-syne), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-syne), system-ui, sans-serif",
    fontFamilyMono: "var(--font-dm-mono), monospace",
  },
};
