import { describe, expect, it } from "vitest";
import type { MesComCobertura } from "./comparativo";
import { mediaDoPainel } from "./mediaDoPainel";

function mes(
  m: string,
  coberturaSaiuPct: number | null = 100,
): MesComCobertura {
  return { mes: m, coberturaSaiuPct };
}

describe("mediaDoPainel", () => {
  it("no meio do ano, tira a média dos meses anteriores do mesmo ano", () => {
    const r = mediaDoPainel(
      [mes("2026-03"), mes("2026-04"), mes("2026-05"), mes("2026-06")],
      "2026-06",
    );

    expect(r).toMatchObject({
      pode: true,
      mesesNaMedia: 3,
      frase: "comparado com a média de 3 meses",
    });
  });

  /*
   * ⚠ A virada: dezembro existe e é confiável, mas é de outro ano. Painel e
   * `/comparativo` recortam pelo ano, então janeiro é "primeiro mês".
   */
  it("no primeiro mês do ano, os meses do ano anterior não entram", () => {
    const r = mediaDoPainel(
      [mes("2025-11"), mes("2025-12"), mes("2026-01")],
      "2026-01",
    );

    expect(r).toEqual({
      pode: false,
      motivo: "primeiro-mes",
      descartados: 0,
    });
  });

  it("ignora meses de outro ano mesmo no meio do ano", () => {
    const r = mediaDoPainel(
      [mes("2025-12"), mes("2026-05"), mes("2026-06"), mes("2027-01")],
      "2026-06",
    );

    expect(r).toMatchObject({
      pode: true,
      mesesNaMedia: 1,
      frase: "comparado com maio",
    });
  });

  it("descarta meses do ano com cobertura incompleta", () => {
    const r = mediaDoPainel(
      [mes("2026-04", 40), mes("2026-05", null), mes("2026-06")],
      "2026-06",
    );

    expect(r).toEqual({
      pode: false,
      motivo: "anteriores-descartados",
      descartados: 2,
    });
  });

  it("descarta só o mês incompleto e mantém os confiáveis na média", () => {
    const r = mediaDoPainel(
      [mes("2026-03"), mes("2026-04", 30), mes("2026-05"), mes("2026-06")],
      "2026-06",
    );

    expect(r).toMatchObject({ pode: true, mesesNaMedia: 2 });
  });

  it("sem meses nenhum, é primeiro mês", () => {
    expect(mediaDoPainel([], "2026-06")).toEqual({
      pode: false,
      motivo: "primeiro-mes",
      descartados: 0,
    });
  });
});
