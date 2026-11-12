import { describe, expect, it } from "vitest";
import { semAcento } from "./semAcento";

describe("semAcento", () => {
  it("tira acento de letra acentuada", () => {
    expect(semAcento("Açaí")).toBe("Acai");
  });

  it("tira til, cedilha e crase", () => {
    expect(semAcento("Ação à não")).toBe("Acao a nao");
  });

  it("deixa intacto o texto sem acento, com caixa e espaços", () => {
    expect(semAcento("  Gasolina Comum ")).toBe("  Gasolina Comum ");
  });
});
