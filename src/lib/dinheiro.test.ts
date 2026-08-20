import { describe, expect, it } from "vitest";
import { diaEMes, emReais } from "./dinheiro";

describe("emReais", () => {
  it("põe a vírgula no centavo e o ponto no milhar", () => {
    expect(emReais(1500)).toBe("R$ 15,00");
    expect(emReais(1250)).toBe("R$ 12,50");
    expect(emReais(120000)).toBe("R$ 1.200,00");
    expect(emReais(186527)).toBe("R$ 1.865,27");
    expect(emReais(123456789)).toBe("R$ 1.234.567,89");
  });

  it("não perde centavo em valor que quebra em ponto flutuante", () => {
    // `19.90 * 100` é 1989.9999999999998 em JavaScript. A conta aqui é feita
    // em inteiro justamente para o erro não existir na volta.
    expect(emReais(1990)).toBe("R$ 19,90");
    expect(emReais(4329)).toBe("R$ 43,29");
    expect(emReais(1)).toBe("R$ 0,01");
    expect(emReais(0)).toBe("R$ 0,00");
  });

  it("negativo leva o sinal de menos de verdade", () => {
    // U+2212, e não o hífen: alinha melhor com os dígitos em fonte mono.
    expect(emReais(-31819)).toBe("−R$ 318,19");
  });
});

describe("diaEMes", () => {
  it("mostra dia e mês; o ano fica no cabeçalho", () => {
    expect(diaEMes("2026-06-27")).toBe("27/06");
    expect(diaEMes("2026-12-01")).toBe("01/12");
  });
});
