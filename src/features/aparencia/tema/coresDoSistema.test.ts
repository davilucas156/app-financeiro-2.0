import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contraste, emHex, emRgb } from "./contraste";
import { SUPERFICIE_ESCURA_MAIS_CLARA } from "./corNoTema";
import { FUNDO_CLARO, FUNDO_ESCURO } from "./coresDoSistema";

/**
 * Os hex de `coresDoSistema.ts`, conferidos contra a fonte da verdade.
 *
 * Eles vão para metas do HTML, para o manifesto e para o Clerk — lugares onde
 * `var(--color-bg)` não funciona. Sem este teste, mudar o fundo em
 * `globals.css` deixaria a barra do sistema de uma cor e o app de outra, e nem
 * o `tsc` nem o `next build` olham para isso.
 */

const CSS = readFileSync(
  path.resolve(import.meta.dirname, "../../../app/globals.css"),
  "utf8",
);

/** O valor de uma variável declarada em `globals.css` (`--nome: #hex;`). */
function valorDe(variavel: string): string | undefined {
  const achado = new RegExp(`${variavel}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(
    CSS,
  );

  return achado?.[1].toLowerCase();
}

describe("o texto secundário do escuro é legível, não só aprovado", () => {
  it("--color-dim passa de 7 sobre a superfície mais clara", () => {
    /*
     * 4.5 é o mínimo do WCAG para letra de 16px, e o `--color-dim` carrega o
     * texto de 9 a 11px do app inteiro (194 usos). Foi 4.5 e a queixa voltou:
     * "as letras ficam pouco nítidas no escuro". 7 é o AAA.
     */
    const dim = emRgb(valorDe("--color-dim") ?? "");
    expect(dim).not.toBeNull();

    expect(contraste(dim!, SUPERFICIE_ESCURA_MAIS_CLARA)).toBeGreaterThan(7);
  });

  it("a fonte mono parte de peso 500", () => {
    // O traço do DM Mono 400 some a 9–11px sobre fundo escuro; cor sozinha não
    // resolve. O peso fica em `@layer base`, e `font-bold` continua ganhando.
    expect(CSS).toMatch(/\.font-mono\s*\{\s*font-weight:\s*500;\s*\}/);
  });
});

describe("cores do sistema espelham o globals.css", () => {
  it("FUNDO_ESCURO é o --color-bg", () => {
    expect(valorDe("--color-bg")).toBe(FUNDO_ESCURO);
  });

  it("FUNDO_CLARO é o --claro-bg", () => {
    expect(valorDe("--claro-bg")).toBe(FUNDO_CLARO);
  });

  it("SUPERFICIE_ESCURA_MAIS_CLARA é o --color-card2", () => {
    // A régua de contraste da letra do pote (`corNoTema.ts`) mede contra este
    // Rgb; se o CSS clarear o cartão e ele não subir junto, a régua mente.
    expect(valorDe("--color-card2")).toBe(emHex(SUPERFICIE_ESCURA_MAIS_CLARA));
  });
});
