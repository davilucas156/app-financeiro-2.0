import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { POTES_PADRAO } from "./potes-padrao";

/**
 * As cores dos potes moram em dois lugares que precisam concordar.
 *
 * `POTES_PADRAO[].hex` vai para `buckets.cor` no banco (o seed). Os tokens
 * `--color-pote-*` de `globals.css` viram `bg-pote-*`, que é o que
 * `ConcluirOnboarding` renderiza via `classeCor`. Mudar um sem o outro faz o
 * pote aparecer numa cor na tela de boas-vindas e em outra no resto do app,
 * sem que nem o `tsc` nem o `next build` percebam.
 *
 * A caixa do hex é ignorada: `#FF5000` e `#ff5000` são a mesma cor.
 */

const RAIZ = path.resolve(import.meta.dirname, "../..");

const css = readFileSync(path.join(RAIZ, "app/globals.css"), "utf8");

/** `--color-pote-fix: #ff5000;` -> `{ "fix" => "#ff5000" }` */
function tokensDePote(): Map<string, string> {
  const tokens = new Map<string, string>();

  for (const m of css.matchAll(
    /--color-pote-([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]+)\s*;/g,
  )) {
    tokens.set(m[1], m[2].toLowerCase());
  }

  return tokens;
}

const potesComClasse = POTES_PADRAO.filter((p) => p.classeCor);

describe("cores dos potes: POTES_PADRAO x globals.css", () => {
  it("a leitura do CSS achou os tokens (a guarda não está lendo o vazio)", () => {
    expect(tokensDePote().size).toBeGreaterThan(0);
    expect(potesComClasse.length).toBeGreaterThan(0);
  });

  it.each(potesComClasse.map((p) => [p.slug, p] as const))(
    "o pote %s tem token em globals.css com o mesmo hex",
    (_slug, pote) => {
      const casou = /^bg-pote-([a-z0-9-]+)$/.exec(pote.classeCor);

      expect(
        casou,
        `classeCor "${pote.classeCor}" de ${pote.slug} não segue o formato bg-pote-xxx`,
      ).not.toBeNull();

      const sufixo = casou![1];
      const token = tokensDePote().get(sufixo);

      expect(
        token,
        `falta --color-pote-${sufixo} em src/app/globals.css (pote ${pote.slug})`,
      ).toBeDefined();
      expect(token).toBe(pote.hex.toLowerCase());
    },
  );
});
