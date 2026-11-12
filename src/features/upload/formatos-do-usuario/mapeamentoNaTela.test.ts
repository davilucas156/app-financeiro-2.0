import { describe, expect, it } from "vitest";
import { SEPARADORES_VALIDOS } from "@/features/upload/ler-arquivo/palpite";
import { comColuna, rotuloDoSeparador, sugerirNome } from "./mapeamentoNaTela";

describe("comColuna", () => {
  it("define a coluna sem mexer no original", () => {
    const antes = { data: 0 };
    const depois = comColuna(antes, "valor", 2);

    expect(depois).toEqual({ data: 0, valor: 2 });
    expect(antes).toEqual({ data: 0 });
  });

  it("undefined desfaz a escolha", () => {
    expect(comColuna({ data: 0, valor: 2 }, "valor", undefined)).toEqual({
      data: 0,
    });
  });

  it("a coluna 0 é uma escolha, não ausência", () => {
    expect(comColuna({}, "data", 0)).toEqual({ data: 0 });
  });
});

describe("rotuloDoSeparador", () => {
  it("todo separador válido tem rótulo próprio, diferente dele mesmo", () => {
    for (const s of SEPARADORES_VALIDOS) {
      expect(rotuloDoSeparador(s)).not.toBe(s);
    }
  });

  it("um separador desconhecido aparece como ele é", () => {
    expect(rotuloDoSeparador("~")).toBe("~");
  });
});

describe("sugerirNome", () => {
  it("nomeia pela origem", () => {
    expect(sugerirNome("csv_cartao")).toBe("Fatura do cartão");
    expect(sugerirNome("csv_conta")).toBe("Extrato da conta");
  });
});
