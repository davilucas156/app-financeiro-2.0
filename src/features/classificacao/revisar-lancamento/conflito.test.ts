import { describe, expect, it } from "vitest";
import type { CategoriaEscolhivel } from "./categorias";
import { acharConflito } from "./conflito";

const mercado = {
  id: "c1",
  nome: "Mercado",
  emoji: "🛒",
} as CategoriaEscolhivel;

const catalogo = new Map([[mercado.id, mercado]]);
const jaPega = { texto: "uber", categoriaId: "c1" };

describe("acharConflito", () => {
  it("sem regra que pegue, não há conflito", () => {
    expect(acharConflito(null, "c2", catalogo)).toBeNull();
  });

  it("a regra manda para onde você acabou de escolher: não conflita", () => {
    expect(acharConflito(jaPega, "c1", catalogo)).toBeNull();
  });

  it("a regra manda para outro lugar: conflita, com o nome do destino", () => {
    expect(acharConflito(jaPega, "c2", catalogo)).toEqual({
      texto: "uber",
      categoria: "🛒 Mercado",
    });
  });

  it("categoria da regra apagada: volta às duas opções de sempre", () => {
    expect(acharConflito(jaPega, "c2", new Map())).toBeNull();
  });
});
