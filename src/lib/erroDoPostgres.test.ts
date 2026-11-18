import { describe, expect, it } from "vitest";
import { ehCheckViolado, ehUnicidadeViolada } from "./erroDoPostgres";

describe("ehCheckViolado", () => {
  it("lê o código 23514 direto no erro", () => {
    expect(ehCheckViolado({ code: "23514" })).toBe(true);
  });

  it("lê o código na causa, porque o driver do Neon embrulha o erro", () => {
    expect(ehCheckViolado(new Error("falhou", { cause: { code: "23514" } }))).toBe(
      true,
    );
  });

  it("não confunde com unicidade nem com erro sem código", () => {
    expect(ehCheckViolado({ code: "23505" })).toBe(false);
    expect(ehUnicidadeViolada({ code: "23514" })).toBe(false);
    expect(ehCheckViolado(new Error("qualquer"))).toBe(false);
    expect(ehCheckViolado(null)).toBe(false);
  });
});
