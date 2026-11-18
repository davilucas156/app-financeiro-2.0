import { describe, expect, it } from "vitest";
import type { Cobertura } from "./cobertura";
import { fraseDaCobertura, fraseDosPendentes } from "./fraseDaCobertura";

const cobertura = (p: Partial<Cobertura>): Cobertura => ({
  saiuPct: null,
  entrouPct: null,
  completa: false,
  ...p,
});

describe("a frase da cobertura", () => {
  it("com saída e entrada, diz as duas", () => {
    expect(fraseDaCobertura(cobertura({ saiuPct: 60, entrouPct: 100 }))).toBe(
      "Estes números cobrem 60% do que saiu e 100% do que entrou.",
    );
  });

  it("sem saída no mês, não afirma 0% do que saiu", () => {
    const frase = fraseDaCobertura(cobertura({ saiuPct: null, entrouPct: 40 }));

    expect(frase).toBe("Estes números cobrem 40% do que entrou.");
    expect(frase).not.toContain("saiu");
  });

  it("sem entrada no mês, diz só a saída", () => {
    const frase = fraseDaCobertura(cobertura({ saiuPct: 75, entrouPct: null }));

    expect(frase).toBe("Estes números cobrem 75% do que saiu.");
    expect(frase).not.toContain("entrou");
  });

  it("sem dinheiro nenhum, não inventa porcentagem", () => {
    expect(fraseDaCobertura(cobertura({}))).toBe(
      "Estes números ainda não cobrem todo o dinheiro do mês.",
    );
  });

  it("0 e 100 são números de verdade, não ausência", () => {
    expect(fraseDaCobertura(cobertura({ saiuPct: 0, entrouPct: 100 }))).toBe(
      "Estes números cobrem 0% do que saiu e 100% do que entrou.",
    );
    expect(fraseDaCobertura(cobertura({ saiuPct: 0, entrouPct: null }))).toBe(
      "Estes números cobrem 0% do que saiu.",
    );
  });
});

describe("a frase dos pendentes", () => {
  it("1 lançamento fica no singular", () => {
    expect(fraseDosPendentes(1)).toBe(
      "1 lançamento ainda não caiu em pote nenhum",
    );
  });

  it("2 lançamentos ficam no plural", () => {
    expect(fraseDosPendentes(2)).toBe(
      "2 lançamentos ainda não caíram em pote nenhum",
    );
  });

  it("0 lançamentos ficam no plural", () => {
    expect(fraseDosPendentes(0)).toBe(
      "0 lançamentos ainda não caíram em pote nenhum",
    );
  });
});
