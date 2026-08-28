import { describe, expect, it } from "vitest";
import { TAMANHO_MAXIMO, formatarTamanho, recusar } from "./limites";

const arquivo = (name: string, size: number) => ({ name, size });

describe("formatarTamanho", () => {
  it("usa vírgula decimal, como o resto do produto", () => {
    expect(formatarTamanho(1740)).toBe("1,7 KB");
    expect(formatarTamanho(3190)).toBe("3,1 KB");
  });

  it("bytes, KB e MB conforme o tamanho", () => {
    expect(formatarTamanho(512)).toBe("512 B");
    expect(formatarTamanho(2 * 1024 * 1024)).toBe("2,0 MB");
  });
});

describe("recusar", () => {
  it("aceita os arquivos reais do Davi", () => {
    expect(
      recusar(arquivo("Extrato-02-06-2026-a-02-07-2026-CSV.csv", 1760)),
    ).toBeNull();
    expect(recusar(arquivo("fatura-inter-2026-07.csv", 3189))).toBeNull();
  });

  it("aceita extensão em caixa alta", () => {
    expect(recusar(arquivo("EXTRATO.CSV", 1000))).toBeNull();
  });

  it("recusa o que não é csv", () => {
    expect(recusar(arquivo("extrato.pdf", 1000))).toContain(".csv");
    expect(recusar(arquivo("extrato.xlsx", 1000))).toContain(".csv");
    expect(recusar(arquivo("extrato", 1000))).toContain(".csv");
  });

  it("recusa arquivo grande demais, dizendo o tamanho", () => {
    const msg = recusar(arquivo("x.csv", 3 * 1024 * 1024));
    expect(msg).toContain("3,0 MB");
    expect(msg).toContain("2 MB");
  });

  it("aceita exatamente no limite", () => {
    expect(recusar(arquivo("x.csv", TAMANHO_MAXIMO))).toBeNull();
  });

  it("recusa arquivo vazio", () => {
    expect(recusar(arquivo("x.csv", 0))).toContain("vazio");
  });
});
