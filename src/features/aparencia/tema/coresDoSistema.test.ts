import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { emHex } from "./contraste";
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
