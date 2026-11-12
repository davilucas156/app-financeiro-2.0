import { describe, expect, it } from "vitest";
import { hrefDoComparativo, hrefDoMes } from "./hrefs";

describe("hrefs das abas", () => {
  it("o mês leva ao painel dele", () => {
    expect(hrefDoMes("2026-08")).toBe("/dashboard?mes=2026-08");
  });

  it("o ano leva ao comparativo, com texto ou número", () => {
    expect(hrefDoComparativo("2026")).toBe("/comparativo?ano=2026");
    expect(hrefDoComparativo(2026)).toBe("/comparativo?ano=2026");
  });
});
