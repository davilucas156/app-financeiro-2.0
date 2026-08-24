import { describe, expect, it } from "vitest";
import { emCentavos, paraOCampo } from "./emCentavos";

describe("o que o Davi digita vira centavos inteiros (D2)", () => {
  it("número seco é em reais", () => {
    expect(emCentavos("1200")).toBe(120_000);
  });

  it("aceita R$, espaço e ponto de milhar", () => {
    expect(emCentavos("R$ 1.200")).toBe(120_000);
    expect(emCentavos("  1.200  ")).toBe(120_000);
  });

  it("vírgula é decimal", () => {
    expect(emCentavos("1200,50")).toBe(120_050);
    expect(emCentavos("R$ 1.200,50")).toBe(120_050);
  });

  it("ponto também é decimal quando sobram 1 ou 2 dígitos", () => {
    expect(emCentavos("1200.50")).toBe(120_050);
    expect(emCentavos("1200.5")).toBe(120_050);
  });

  it("⚠ `1.200` é mil e duzentos, não um e vinte", () => {
    // O palpite é explícito: só é decimal se sobrarem 1 ou 2 dígitos depois do
    // último separador. Três dígitos é milhar.
    expect(emCentavos("1.200")).toBe(120_000);
    expect(emCentavos("1,200")).toBe(120_000);
  });

  it("milhar e decimal juntos", () => {
    expect(emCentavos("12.345,67")).toBe(1_234_567);
  });

  it("⚠ nunca passa por ponto flutuante", () => {
    /*
     * `19.90 * 100` é `1989.9999999999998` — o erro que a spec 02 pegou lendo o
     * extrato. Um centavo perdido aqui entra na base de todas as metas do mês.
     */
    expect(emCentavos("19,90")).toBe(1_990);
    expect(emCentavos("0,07")).toBe(7);
    expect(emCentavos("1000,10")).toBe(100_010);
  });

  it("zero é um valor, e não uma recusa", () => {
    expect(emCentavos("0")).toBe(0);
    expect(emCentavos("0,00")).toBe(0);
  });
});

describe("o que não é valor devolve null", () => {
  it.each(["", "   ", "abc", "R$", "-100", ",50", "1,2,3,4", "12.34.56"])(
    "%o",
    (entrada) => {
      expect(emCentavos(entrada)).toBeNull();
    },
  );
});

describe("de volta para o campo", () => {
  it("mostra com vírgula e dois dígitos", () => {
    expect(paraOCampo(120_000)).toBe("1200,00");
    expect(paraOCampo(120_050)).toBe("1200,50");
    expect(paraOCampo(7)).toBe("0,07");
  });

  it("ida e volta não perde centavo", () => {
    for (const c of [0, 7, 1_990, 120_000, 1_234_567]) {
      expect(emCentavos(paraOCampo(c))).toBe(c);
    }
  });
});

describe("agrupamento de milhar", () => {
  it("três dígitos depois do separador é milhar, não centavo", () => {
    // Foi o teste que EU escrevi errado: pela regra do último separador,
    // `12,345` são doze mil trezentos e quarenta e cinco reais.
    expect(emCentavos("12,345")).toBe(1_234_500);
    expect(emCentavos("1.234.567")).toBe(123_456_700);
  });

  it("⚠ pedaços soltos não viram número plausível", () => {
    // `1,2,3,4` devolvia R$ 123,40 — um valor inventado na base de todas as
    // metas do mês, a partir de uma digitação que não quis dizer nada.
    expect(emCentavos("1,2,3,4")).toBeNull();
    expect(emCentavos("12.34.56")).toBeNull();
  });
});
