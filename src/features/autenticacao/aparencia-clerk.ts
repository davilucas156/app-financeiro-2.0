// `@clerk/types` foi descontinuado no Core 3 e o tipo `Appearance` virou
// `ClerkAppearanceTheme`. Os tipos vêm do subpath do SDK.
import type { ClerkAppearanceTheme } from "@clerk/nextjs/types";

/**
 * Aparência dos widgets do Clerk, para eles não parecerem um enxerto de outro
 * produto dentro do painel.
 *
 * **As cores vêm dos tokens da A2 via `var(--color-*)`, não de hex literal.**
 * O Tailwind 4 emite os tokens do `@theme` no `:root`, então a regra
 * "nenhuma cor literal em componente" (`references/architecture.md`) continua
 * valendo aqui dentro.
 *
 * Os nomes das variáveis são os do **Core 3**, que renomeou boa parte delas:
 * não existem mais `colorText`, `colorTextSecondary`, `colorInputBackground`
 * nem `colorInputText`. O par correto é `color*` / `color*Foreground`.
 *
 * Compartilhado por `fazer-login` e `cadastrar-usuario` — fica no nível da
 * área porque os dois comportamentos usam, e divergir seria pior.
 */
export const APARENCIA_CLERK: ClerkAppearanceTheme = {
  variables: {
    colorBackground: "var(--color-card)",
    colorForeground: "var(--color-text)",

    colorPrimary: "var(--color-primary)",
    // Texto sobre o laranja: escuro, como no `Button` da A3.
    colorPrimaryForeground: "var(--color-bg)",

    colorMuted: "var(--color-card2)",
    colorMutedForeground: "var(--color-dim)",

    colorInput: "var(--color-card2)",
    colorInputForeground: "var(--color-text)",

    colorBorder: "var(--color-border2)",
    colorNeutral: "var(--color-dim)",

    colorDanger: "var(--color-red)",
    colorSuccess: "var(--color-green)",
    colorWarning: "var(--color-gold)",

    fontFamily: "var(--font-syne), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-syne), system-ui, sans-serif",
    fontFamilyMono: "var(--font-dm-mono), monospace",
  },
};
