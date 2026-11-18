import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TAMANHO_PADRAO, TAMANHOS } from "../letra/letra";
import { TEMA_PADRAO, TEMAS } from "./tema";

/**
 * Os seletores de `globals.css` contra as listas de valores.
 *
 * `data-tema` e `data-letra` são carimbados no `<html>` com o valor que vem de
 * `TEMAS` e `TAMANHOS`, mas o seletor que reage a ele é escrito à mão no CSS.
 * Acrescentar `"sepia"` à lista sem escrever o bloco não dá erro em lugar
 * nenhum: o atributo é carimbado, nada o recebe, e a opção aparece na tela de
 * configurações sem fazer nada.
 *
 * O valor padrão fica de fora: ele é o `:root` sem atributo, e não tem bloco
 * próprio.
 */

const CSS = readFileSync(
  path.resolve(import.meta.dirname, "../../../app/globals.css"),
  "utf8",
);

function temSeletor(atributo: string, valor: string): boolean {
  return CSS.includes(`[${atributo}="${valor}"]`);
}

describe("todo valor de TEMAS tem seletor no globals.css", () => {
  const comBloco = TEMAS.filter((tema) => tema !== TEMA_PADRAO);

  it("há valores além do padrão para conferir", () => {
    expect(comBloco.length).toBeGreaterThan(0);
  });

  it.each(comBloco)('[data-tema="%s"]', (tema) => {
    expect(temSeletor("data-tema", tema)).toBe(true);
  });
});

describe("todo valor de TAMANHOS tem seletor no globals.css", () => {
  const comBloco = TAMANHOS.filter((tamanho) => tamanho !== TAMANHO_PADRAO);

  it("há valores além do padrão para conferir", () => {
    expect(comBloco.length).toBeGreaterThan(0);
  });

  it.each(comBloco)('[data-letra="%s"]', (tamanho) => {
    expect(temSeletor("data-letra", tamanho)).toBe(true);
  });
});
