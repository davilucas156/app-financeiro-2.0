import { describe, expect, it } from "vitest";
import { mesAtual } from "@/lib/mes";
import { JANELA_DE_MESES, mesesDisponiveis } from "./mesesDisponiveis";

describe("mesesDisponiveis", () => {
  const hoje = new Date(Date.UTC(2026, 5, 15));

  it("começa pelo mês de hoje", () => {
    expect(mesesDisponiveis(hoje)[0]).toBe("2026-06");
  });

  it("devolve a janela inteira por padrão", () => {
    expect(JANELA_DE_MESES).toBe(18);
    expect(mesesDisponiveis(hoje)).toHaveLength(JANELA_DE_MESES);
  });

  it("respeita o tamanho pedido", () => {
    expect(mesesDisponiveis(hoje, 3)).toEqual([
      "2026-06",
      "2026-05",
      "2026-04",
    ]);
    expect(mesesDisponiveis(hoje, 0)).toEqual([]);
  });

  it("vai do mais recente para o mais antigo", () => {
    const lista = mesesDisponiveis(hoje);

    expect(lista).toEqual([...lista].sort().reverse());
    expect(lista.at(-1)).toBe("2025-01");
  });

  it("atravessa a virada de ano", () => {
    const janeiro = new Date(Date.UTC(2026, 0, 10));

    expect(mesesDisponiveis(janeiro, 3)).toEqual([
      "2026-01",
      "2025-12",
      "2025-11",
    ]);
  });

  it("não oferece mês futuro", () => {
    const lista = mesesDisponiveis(hoje);

    expect(lista.every((mes) => mes <= mesAtual(hoje))).toBe(true);
  });

  it("no último dia do mês em UTC ainda é o mês de hoje", () => {
    const ultimoDia = new Date(Date.UTC(2026, 0, 31, 23, 59, 59));

    expect(mesesDisponiveis(ultimoDia, 2)).toEqual(["2026-01", "2025-12"]);
  });
});
