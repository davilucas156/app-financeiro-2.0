// `@clerk/types` foi descontinuado no Core 3 e o tipo `Appearance` virou
// `ClerkAppearanceTheme`. Os tipos vêm do subpath do SDK.
import type { ClerkAppearanceTheme } from "@clerk/nextjs/types";
import type { TemaEfetivo } from "@/features/aparencia/tema/tema";

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
 * ⚠ **A spec 08 dobrou esta duplicação, e é o preço mais alto que ela paga.**
 * Agora são dois conjuntos de treze cores que precisam acompanhar
 * `globals.css` à mão. É também a razão de esta spec ter servidor: sem o
 * Clerk, tema seria CSS e um botão. Ao mudar um token lá, mude os **dois**
 * lados aqui.
 *
 * As **fontes** continuam como `var(...)`: fonte não passa por cálculo, é
 * repassada direto para o CSS.
 *
 * Os nomes das variáveis são os do **Core 3**, que renomeou boa parte delas:
 * não existem mais `colorText`, `colorTextSecondary`, `colorInputBackground`
 * nem `colorInputText`. O par correto é `color*` / `color*Foreground`.
 */

const FONTES = {
  fontFamily: "var(--font-syne), system-ui, sans-serif",
  fontFamilyButtons: "var(--font-syne), system-ui, sans-serif",
  fontFamilyMono: "var(--font-dm-mono), monospace",
};

const ESCURO: ClerkAppearanceTheme = {
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

    ...FONTES,
  },
};

const CLARO: ClerkAppearanceTheme = {
  variables: {
    colorBackground: "#ffffff", // --claro-card
    colorForeground: "#16161c", // --claro-text

    colorPrimary: "#c23d00", // --claro-primary
    /*
     * ⚠ **Aqui o par se inverte junto com o tema, e tinha de inverter.** No
     * escuro o texto sobre o laranja é quase preto; no claro, o laranja
     * escureceu para poder ser lido, e texto escuro sobre ele ficaria
     * ilegível. É `--claro-bg`, que é quase branco — o mesmo token dos dois
     * lados, valendo coisas opostas.
     */
    colorPrimaryForeground: "#eeeef3", // --claro-bg

    colorMuted: "#e9e9f0", // --claro-card2
    colorMutedForeground: "#61617a", // --claro-dim

    colorInput: "#ffffff", // --claro-card
    colorInputForeground: "#16161c", // --claro-text

    colorBorder: "#cfcfda", // --claro-border2
    colorNeutral: "#61617a", // --claro-dim

    colorDanger: "#db0000", // --claro-red
    colorSuccess: "#007a56", // --claro-green
    colorWarning: "#8f6300", // --claro-gold

    ...FONTES,
  },
};

export function aparenciaClerk(tema: TemaEfetivo): ClerkAppearanceTheme {
  return tema === "claro" ? CLARO : ESCURO;
}
