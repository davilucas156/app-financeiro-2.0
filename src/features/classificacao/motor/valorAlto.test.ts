import { describe, expect, it } from "vitest";
import { statusDoValor, VALOR_ALTO_CENTAVOS } from "./valorAlto";

describe("statusDoValor", () => {
  it("abaixo da régua segue importado, sem motivo", () => {
    expect(statusDoValor(VALOR_ALTO_CENTAVOS - 1)).toEqual({
      status: "importado",
      motivo: null,
    });
  });

  it("na régua e acima pede confirmação, com o motivo", () => {
    const r = statusDoValor(VALOR_ALTO_CENTAVOS);
    expect(r.status).toBe("revisao_pendente");
    expect(r.motivo).toMatch(/valor alto/);
  });
});
