import { describe, expect, it } from "vitest";
import { mesesDoAno } from "./anoDoComparativo";
import { cartoesDoAno } from "./cartaoDoAno";
import { compararMeses, type MesNoHistorico } from "./comparativo";

/**
 * O cartão e a barra têm de contar a mesma história (spec 12, tarefa E1).
 *
 * ⚠ **Por construção elas não podem divergir**: `cartoesDoAno` lê
 * `comparativo.linhas`, o mesmo array que a `SecaoDoComparativo` desenha. Este
 * teste não persegue uma coincidência — ele **guarda a estrutura**, e reprova
 * quem um dia fizer o cartão buscar os próprios números.
 *
 * É a régua do `references/formatos-de-extrato.md` aplicada aqui: somar o que a
 * própria função leu não prova nada; conferir duas leituras do mesmo dado,
 * prova.
 */

function mes(
  m: string,
  potes: Record<string, number>,
  coberturaSaiuPct: number | null = 90,
): MesNoHistorico {
  return {
    mes: m,
    coberturaSaiuPct,
    potes: Object.entries(potes).map(([poteId, totalCentavos]) => ({
      poteId,
      totalCentavos,
    })),
  };
}

/** Dois anos, três potes, um mês mal classificado no meio. */
const HISTORICO: MesNoHistorico[] = [
  mes("2025-11", { fixos: 33000, lazer: 13500, manutencao: 34500 }),
  mes("2025-12", { fixos: 21700, lazer: 26400, manutencao: 0 }),
  mes("2026-01", { fixos: 38200, lazer: 10100, manutencao: 54187 }),
  mes("2026-02", { fixos: 32900, lazer: 27800, manutencao: 14000 }, 40),
  mes("2026-03", { fixos: 43700, lazer: 5700, manutencao: 35204 }),
];

describe("o cartão e a barra do mesmo pote, no mesmo ano", () => {
  it("desenham exatamente a mesma série", () => {
    const comparativo = compararMeses(mesesDoAno(HISTORICO, "2026"), "2026-03");
    const cartoes = cartoesDoAno(comparativo.linhas);

    expect(cartoes).toHaveLength(comparativo.linhas.length);

    for (const [i, cartao] of cartoes.entries()) {
      expect(cartao.poteId).toBe(comparativo.linhas[i].poteId);
      expect(cartao.serie).toEqual(comparativo.linhas[i].serie);
    }
  });

  it("o total do cartão é a soma das barras daquele pote", () => {
    const comparativo = compararMeses(mesesDoAno(HISTORICO, "2026"), "2026-03");

    for (const cartao of cartoesDoAno(comparativo.linhas)) {
      const somaDasBarras = comparativo.linhas
        .find((l) => l.poteId === cartao.poteId)!
        .serie.reduce((s, v) => s + v.totalCentavos, 0);

      expect(cartao.totalCentavos).toBe(somaDasBarras);
    }
  });

  /*
   * ⚠ O ano é um recorte, e recorte que vaza é o defeito mais caro possível
   * aqui: um total anual que soma mês de outro ano parece certo e está errado.
   */
  it("não deixa mês de outro ano entrar no total", () => {
    const de2026 = compararMeses(mesesDoAno(HISTORICO, "2026"), "2026-03");
    const de2025 = compararMeses(mesesDoAno(HISTORICO, "2025"), "2025-12");

    const fixos2026 = cartoesDoAno(de2026.linhas).find(
      (c) => c.poteId === "fixos",
    )!;
    const fixos2025 = cartoesDoAno(de2025.linhas).find(
      (c) => c.poteId === "fixos",
    )!;

    expect(fixos2026.totalCentavos).toBe(38200 + 32900 + 43700);
    expect(fixos2026.mesesComDado).toBe(3);

    expect(fixos2025.totalCentavos).toBe(33000 + 21700);
    expect(fixos2025.mesesComDado).toBe(2);
  });

  it("marca o cartão do ano que tem mês pouco classificado, e só ele", () => {
    const de2026 = cartoesDoAno(
      compararMeses(mesesDoAno(HISTORICO, "2026"), "2026-03").linhas,
    );
    const de2025 = cartoesDoAno(
      compararMeses(mesesDoAno(HISTORICO, "2025"), "2025-12").linhas,
    );

    expect(de2026.every((c) => c.temMesPoucoClassificado)).toBe(true);
    expect(de2025.some((c) => c.temMesPoucoClassificado)).toBe(false);
  });

  /*
   * ⚠ **Mês posterior ao de referência não entra em lugar nenhum.** A regra é do
   * `compararMeses` ("olhando maio, junho ainda não aconteceu"), e o cartão a
   * herda de graça — justamente por nascer da linha.
   */
  it("ignora mês posterior ao de referência, como a barra", () => {
    const comparativo = compararMeses(mesesDoAno(HISTORICO, "2026"), "2026-01");
    const [cartao] = cartoesDoAno(comparativo.linhas).filter(
      (c) => c.poteId === "fixos",
    );

    expect(cartao.mesesComDado).toBe(1);
    expect(cartao.totalCentavos).toBe(38200);
  });
});
