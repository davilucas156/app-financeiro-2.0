import { describe, expect, it } from "vitest";
import { avisoDaTroca, ehTrocaDeVerdade } from "./troca";

describe("avisoDaTroca", () => {
  it("avisa que a regra continua valendo quando a classificação veio de uma", () => {
    const aviso = avisoDaTroca(true);

    expect(aviso).not.toBeNull();
    expect(aviso).toContain("regra continua valendo");
  });

  it("cala quando a classificação foi sua — não há regra para continuar valendo", () => {
    expect(avisoDaTroca(false)).toBeNull();
  });
});

describe("ehTrocaDeVerdade", () => {
  it("recusa a categoria que o lançamento já tem", () => {
    expect(ehTrocaDeVerdade("cat-1", "cat-1")).toBe(false);
  });

  it("aceita qualquer outra", () => {
    expect(ehTrocaDeVerdade("cat-1", "cat-2")).toBe(true);
  });
});
