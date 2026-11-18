import { describe, expect, it } from "vitest";
import {
  ACCEPT_DO_INPUT,
  EXTENSOES_ACEITAS,
  LIMITE_EM_TEXTO,
  TAMANHO_MAXIMO,
  formatarTamanho,
  recusar,
} from "./limites";

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

describe("constantes exportadas", () => {
  it("o accept do input junta a extensão e o MIME", () => {
    expect(EXTENSOES_ACEITAS).toEqual([".csv"]);
    expect(ACCEPT_DO_INPUT).toBe(".csv,text/csv");
  });

  it("o limite em texto é '2 MB', sem a casa decimal de formatarTamanho", () => {
    expect(TAMANHO_MAXIMO).toBe(2 * 1024 * 1024);
    expect(LIMITE_EM_TEXTO).toBe("2 MB");
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

  it("a mensagem de extensão tem o texto exato", () => {
    expect(recusar(arquivo("extrato.pdf", 1000))).toBe(
      "Só aceito arquivo .csv. Exporte o extrato em CSV no app do banco.",
    );
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
    expect(msg).toBe("Esse arquivo tem 3,0 MB e o limite é 2 MB.");
  });

  it("aceita exatamente no limite", () => {
    expect(recusar(arquivo("x.csv", TAMANHO_MAXIMO))).toBeNull();
  });

  it("recusa um byte acima do limite", () => {
    expect(recusar(arquivo("x.csv", TAMANHO_MAXIMO + 1))).toBe(
      "Esse arquivo tem 2,0 MB e o limite é 2 MB.",
    );
  });

  it("recusa arquivo vazio", () => {
    expect(recusar(arquivo("x.csv", 0))).toContain("vazio");
  });

  it("recusa tamanho NaN e negativo como vazio", () => {
    expect(recusar(arquivo("x.csv", NaN))).toBe("Esse arquivo está vazio.");
    expect(recusar(arquivo("x.csv", -1))).toBe("Esse arquivo está vazio.");
  });

  it("a extensão vence o vazio: x.pdf com 0 bytes dá a mensagem de extensão", () => {
    expect(recusar(arquivo("x.pdf", 0))).toBe(
      "Só aceito arquivo .csv. Exporte o extrato em CSV no app do banco.",
    );
  });

  it("um nome que é só a extensão passa", () => {
    expect(recusar(arquivo(".csv", 1000))).toBeNull();
  });
});
