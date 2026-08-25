import { describe, expect, it } from "vitest";
import { BRANCO, contraste, emRgb, luminancia } from "./contraste";

/** Atalho: só para o teste ficar legível. */
function razao(a: string, b: string): number {
  const ra = emRgb(a);
  const rb = emRgb(b);
  if (ra === null || rb === null) throw new Error(`hex inválido: ${a} / ${b}`);
  return contraste(ra, rb);
}

describe("a régua, aferida antes de medir qualquer coisa (A1)", () => {
  it("preto contra branco é exatamente 21", () => {
    expect(razao("#000000", "#ffffff")).toBeCloseTo(21, 10);
  });

  it("uma cor contra ela mesma é exatamente 1", () => {
    expect(razao("#ff5000", "#ff5000")).toBeCloseTo(1, 10);
    expect(razao("#00e5a0", "#00e5a0")).toBeCloseTo(1, 10);
  });

  it("a ordem dos argumentos não muda a resposta", () => {
    expect(razao("#060608", "#e8e8f0")).toBeCloseTo(
      razao("#e8e8f0", "#060608"),
      10,
    );
  });

  it("branco tem luminância 1 e preto, 0", () => {
    expect(luminancia(BRANCO)).toBeCloseTo(1, 10);
    expect(luminancia([0, 0, 0])).toBeCloseTo(0, 10);
  });
});

describe("a medição que motivou a spec 08 (descoberta 2)", () => {
  const FUNDO_ESCURO = "#060608"; // --color-bg de hoje

  it("⚠ o verde e o dourado despencam num fundo claro", () => {
    /*
     * São as duas cores que carregam significado na tela: verde é "entrou" e
     * "dentro da meta", dourado é "meta" e o aviso de cobertura baixa. No
     * escuro são as mais legíveis do app; no branco, as menos.
     *
     * O mínimo para texto é 4.5. É a razão de o tema claro reescolher as cores
     * semânticas em vez de inverter as que existem.
     */
    expect(razao("#00e5a0", FUNDO_ESCURO)).toBeGreaterThan(12);
    expect(razao("#00e5a0", "#ffffff")).toBeLessThan(2);

    expect(razao("#ffc94d", FUNDO_ESCURO)).toBeGreaterThan(13);
    expect(razao("#ffc94d", "#ffffff")).toBeLessThan(2);
  });

  it("os cinzas, ao contrário, espelham bem", () => {
    // `--color-dim` é o rótulo de toda a tela: 96 usos. No escuro dá 3.02, no
    // claro 6.71. Cinza é cinza, e é por isso que a base pode ser espelhada.
    expect(razao("#5a5a70", FUNDO_ESCURO)).toBeGreaterThan(3);
    expect(razao("#5a5a70", "#ffffff")).toBeGreaterThan(6);
  });
});

describe("hex que não dá para ler", () => {
  it("devolve null em vez de lançar", () => {
    // `buckets.cor` é `text` no Postgres. Uma exceção aqui derrubaria o painel
    // inteiro por causa de uma barra colorida.
    expect(emRgb("")).toBeNull();
    expect(emRgb("verde")).toBeNull();
    expect(emRgb("#12345")).toBeNull();
    expect(emRgb("#gggggg")).toBeNull();
  });

  it("aceita as formas que o projeto realmente tem", () => {
    // `potes-padrao.ts` grava `#FF5000` em caixa alta e o resto em minúscula.
    expect(emRgb("#FF5000")).toEqual([255, 80, 0]);
    expect(emRgb("#ff5000")).toEqual([255, 80, 0]);
    expect(emRgb("ff5000")).toEqual([255, 80, 0]);
    expect(emRgb("  #ff5000  ")).toEqual([255, 80, 0]);
    expect(emRgb("#f50")).toEqual([255, 85, 0]);
  });
});
