import { describe, expect, it } from "vitest";
import type { LinhaDoComparativo, ValorNoMes } from "./comparativo";
import {
  anosDaSerie,
  larguraEmPct,
  maiorValorDaTela,
  ultimoMesDaLinha,
} from "./escalaDasBarras";

function valor(mes: string, totalCentavos: number): ValorNoMes {
  return { mes, totalCentavos, confiavel: true };
}

function linha(
  serie: ValorNoMes[],
  mediaCentavos: number | null = null,
): LinhaDoComparativo {
  return {
    poteId: "pote",
    esteMesCentavos: serie.at(-1)?.totalCentavos ?? 0,
    mediaCentavos,
    diferencaCentavos: null,
    serie,
  };
}

describe("larguraEmPct", () => {
  /* Teto zero não tem com o que medir: a barra fica vazia, sem divisão por zero. */
  it("devolve zero quando o teto é zero", () => {
    expect(larguraEmPct(0, 0)).toBe(0);
    expect(larguraEmPct(5000, 0)).toBe(0);
  });

  it("arredonda para a porcentagem inteira mais próxima", () => {
    expect(larguraEmPct(1, 3)).toBe(33);
    expect(larguraEmPct(2, 3)).toBe(67);
  });

  /* A média pode passar do maior mês; a barra não pode sair do trilho. */
  it("trava em 100 quando o valor passa do teto", () => {
    expect(larguraEmPct(150, 100)).toBe(100);
  });
});

describe("maiorValorDaTela", () => {
  it("considera a média, quando ela é maior que qualquer mês", () => {
    const linhas = [linha([valor("2026-01", 100), valor("2026-02", 200)], 900)];

    expect(maiorValorDaTela(linhas)).toBe(900);
  });

  it("devolve zero quando não há valor nenhum", () => {
    expect(maiorValorDaTela([])).toBe(0);
  });
});

describe("anosDaSerie", () => {
  it("conta um ano quando a série fica dentro dele", () => {
    const linhas = [linha([valor("2026-01", 1), valor("2026-06", 2)])];

    expect(anosDaSerie(linhas)).toBe(1);
  });

  it("conta dois anos quando a série atravessa a virada", () => {
    const linhas = [
      linha([valor("2025-11", 1), valor("2025-12", 2), valor("2026-01", 3)]),
    ];

    expect(anosDaSerie(linhas)).toBe(2);
  });
});

describe("ultimoMesDaLinha", () => {
  it("devolve o mês mais novo da série", () => {
    expect(
      ultimoMesDaLinha(linha([valor("2025-12", 1), valor("2026-01", 2)])),
    ).toBe("2026-01");
  });

  it("devolve undefined quando a série está vazia", () => {
    expect(ultimoMesDaLinha(linha([]))).toBeUndefined();
  });
});
