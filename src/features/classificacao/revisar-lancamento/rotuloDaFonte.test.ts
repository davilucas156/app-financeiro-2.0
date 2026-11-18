import { describe, expect, it } from "vitest";
import { FONTES_DE_SUGESTAO } from "@/features/classificacao/motor/sugestoes";
import { ROTULO_DA_FONTE, rotuloDaFonte } from "./rotuloDaFonte";

describe("rotuloDaFonte", () => {
  it("toda fonte de sugestão tem rótulo legível", () => {
    for (const fonte of FONTES_DE_SUGESTAO) {
      expect(rotuloDaFonte(fonte).trim()).not.toBe("");
      expect(rotuloDaFonte(fonte)).not.toBe(fonte);
    }
  });

  it("não sobra rótulo para fonte que não existe", () => {
    expect(Object.keys(ROTULO_DA_FONTE).sort()).toEqual(
      [...FONTES_DE_SUGESTAO].sort(),
    );
  });

  it("mantém os textos que a tela de revisão já mostrava", () => {
    expect(rotuloDaFonte("voce-ja-classificou")).toBe("seu histórico");
    expect(rotuloDaFonte("mesma-contraparte")).toBe("mesma pessoa");
    expect(rotuloDaFonte("categoria-do-banco")).toBe("palpite do banco");
    expect(rotuloDaFonte("pote-do-banco")).toBe("banco + histórico");
  });
});
