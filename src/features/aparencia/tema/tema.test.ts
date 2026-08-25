import { describe, expect, it } from "vitest";
import { TEMA_PADRAO, TEMAS, temaEscolhido } from "./tema";

describe("o que veio no cookie vira um dos três temas (A2)", () => {
  it("os três valores passam", () => {
    expect(temaEscolhido("escuro")).toBe("escuro");
    expect(temaEscolhido("claro")).toBe("claro");
    expect(temaEscolhido("sistema")).toBe("sistema");
  });

  it("sem cookie é o padrão", () => {
    expect(temaEscolhido(undefined)).toBe(TEMA_PADRAO);
    expect(temaEscolhido(null)).toBe(TEMA_PADRAO);
    expect(temaEscolhido("")).toBe(TEMA_PADRAO);
  });

  it("⚠ o padrão é escuro, e é decisão", () => {
    /*
     * Não é "o primeiro da lista". Hoje todo mundo está no escuro, e a maioria
     * dos celulares está em claro: subir com `sistema` como padrão viraria o
     * app do Davi para branco no primeiro deploy, sem ele ter pedido nada.
     *
     * Se este teste falhar depois de alguém trocar a constante, a pergunta é a
     * pendência 3 da spec 08 — não é um valor a "corrigir".
     */
    expect(TEMA_PADRAO).toBe("escuro");
  });

  it("valor desconhecido cai no padrão, sem exceção", () => {
    // Quase sempre é um valor gravado por uma versão anterior do app, não um
    // ataque. Lançar aqui derrubaria a página por causa de um cookie velho.
    expect(temaEscolhido("roxo")).toBe(TEMA_PADRAO);
    expect(temaEscolhido("dark")).toBe(TEMA_PADRAO);
    expect(temaEscolhido("<script>")).toBe(TEMA_PADRAO);
    expect(temaEscolhido("escuro; claro")).toBe(TEMA_PADRAO);
  });

  it("perdoa caixa e espaço", () => {
    expect(temaEscolhido("Claro")).toBe("claro");
    expect(temaEscolhido("  SISTEMA  ")).toBe("sistema");
  });

  it("o padrão é um dos temas — e não um quarto valor", () => {
    expect(TEMAS).toContain(TEMA_PADRAO);
  });
});
