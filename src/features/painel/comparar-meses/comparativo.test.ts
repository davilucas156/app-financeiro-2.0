import { describe, expect, it } from "vitest";
import { compararMeses, type MesNoHistorico } from "./comparativo";

const mes = (
  m: string,
  coberturaSaiuPct: number | null,
  potes: Record<string, number>,
): MesNoHistorico => ({
  mes: m,
  coberturaSaiuPct,
  potes: Object.entries(potes).map(([poteId, totalCentavos]) => ({
    poteId,
    totalCentavos,
  })),
});

describe("quando ainda não dá para tirar média", () => {
  it("com um mês só, o motivo é o primeiro mês", () => {
    /*
     * O estado real do banco na medição da spec: um mês fechado. A tela precisa
     * apontar para o `/upload`, não para a `/revisao`.
     */
    const r = compararMeses([mes("2026-06", 100, { casa: 100 })], "2026-06");

    expect(r.media).toEqual({
      pode: false,
      motivo: "primeiro-mes",
      descartados: 0,
    });
  });

  it("com anteriores mal classificados, o motivo é outro", () => {
    /*
     * A distinção que faz o tipo ter dois motivos: dizer "volte quando tiver
     * dois meses" seria falso — eles existem. O que falta é trabalho de
     * revisão, e a frase da tela manda para outro lugar.
     */
    const r = compararMeses(
      [
        mes("2026-04", 40, { casa: 100 }),
        mes("2026-05", 12, { casa: 100 }),
        mes("2026-06", 100, { casa: 100 }),
      ],
      "2026-06",
    );

    expect(r.media).toEqual({
      pode: false,
      motivo: "anteriores-descartados",
      descartados: 2,
    });
  });

  it("mês anterior sem gasto nenhum também sai da média", () => {
    const r = compararMeses(
      [mes("2026-05", null, {}), mes("2026-06", 100, { casa: 100 })],
      "2026-06",
    );

    expect(r.media).toMatchObject({ pode: false, descartados: 1 });
  });

  it("mês no limiar exato entra", () => {
    const r = compararMeses(
      [mes("2026-05", 90, { casa: 100 }), mes("2026-06", 100, { casa: 100 })],
      "2026-06",
    );

    expect(r.media.pode).toBe(true);
  });

  it("a série existe mesmo sem média — é o mês único, desenhável", () => {
    /*
     * A revisão da A3: as barras saem sempre. Com um mês, o pote tem uma barra
     * e nenhuma comparação, que é o que o painel estático fazia ao anunciar
     * "6 períodos com dados · 5 a preencher".
     */
    const r = compararMeses([mes("2026-06", 100, { casa: 42_000 })], "2026-06");

    expect(r.linhas).toEqual([
      {
        poteId: "casa",
        esteMesCentavos: 42_000,
        mediaCentavos: null,
        diferencaCentavos: null,
        serie: [{ mes: "2026-06", totalCentavos: 42_000, confiavel: true }],
      },
    ]);
  });
});

describe("a frase diz sobre quantos meses está falando", () => {
  it("com um anterior, não usa a palavra média", () => {
    /*
     * O risco nomeado na spec: com um único mês, "a média dos anteriores" é
     * aquele mês, e chamar isso de média é dar peso estatístico a uma amostra
     * de um.
     */
    const r = compararMeses(
      [mes("2026-05", 100, { casa: 100 }), mes("2026-06", 100, { casa: 100 })],
      "2026-06",
    );

    if (!r.media.pode) throw new Error("deveria comparar");
    expect(r.media.mesesNaMedia).toBe(1);
    expect(r.media.frase).toBe("comparado com maio");
    expect(r.media.frase).not.toContain("média");
  });

  it("mês anterior de outro ano leva o ano na frase", () => {
    const r = compararMeses(
      [mes("2025-12", 100, { casa: 100 }), mes("2026-01", 100, { casa: 100 })],
      "2026-01",
    );

    if (!r.media.pode) throw new Error("deveria comparar");
    expect(r.media.frase).toBe("comparado com dezembro de 2025");
  });

  it("com vários, diz quantos", () => {
    const r = compararMeses(
      [
        mes("2026-03", 100, { casa: 100 }),
        mes("2026-04", 100, { casa: 100 }),
        mes("2026-05", 100, { casa: 100 }),
        mes("2026-06", 100, { casa: 100 }),
      ],
      "2026-06",
    );

    if (!r.media.pode) throw new Error("deveria comparar");
    expect(r.media.mesesNaMedia).toBe(3);
    expect(r.media.frase).toBe("média de 3 meses");
  });
});

describe("a média", () => {
  it("compara este mês contra a média dos confiáveis", () => {
    const r = compararMeses(
      [
        mes("2026-04", 100, { casa: 100_000 }),
        mes("2026-05", 100, { casa: 200_000 }),
        mes("2026-06", 100, { casa: 400_000 }),
      ],
      "2026-06",
    );

    expect(r.linhas[0]).toMatchObject({
      poteId: "casa",
      esteMesCentavos: 400_000,
      mediaCentavos: 150_000,
      diferencaCentavos: 250_000,
    });
  });

  it("o mês atual não entra na própria média", () => {
    const r = compararMeses(
      [
        mes("2026-05", 100, { casa: 100_000 }),
        mes("2026-06", 100, { casa: 900_000 }),
      ],
      "2026-06",
    );

    expect(r.linhas[0].mediaCentavos).toBe(100_000);
  });

  it("mês mal classificado sai da média e fica na série", () => {
    /*
     * As duas metades da mesma decisão: some da média quem não pode servir de
     * régua; some da tela quem não existe — e esse mês existe.
     */
    const r = compararMeses(
      [
        mes("2026-04", 30, { casa: 900_000 }),
        mes("2026-05", 100, { casa: 100_000 }),
        mes("2026-06", 100, { casa: 100_000 }),
      ],
      "2026-06",
    );

    expect(r.linhas[0].mediaCentavos).toBe(100_000);
    expect(r.linhas[0].serie).toEqual([
      { mes: "2026-04", totalCentavos: 900_000, confiavel: false },
      { mes: "2026-05", totalCentavos: 100_000, confiavel: true },
      { mes: "2026-06", totalCentavos: 100_000, confiavel: true },
    ]);
  });

  it("a média sai em centavos inteiros", () => {
    const r = compararMeses(
      [
        mes("2026-04", 100, { casa: 100 }),
        mes("2026-05", 100, { casa: 101 }),
        mes("2026-06", 100, { casa: 0 }),
      ],
      "2026-06",
    );

    expect(r.linhas[0].mediaCentavos).toBe(101);
    expect(Number.isInteger(r.linhas[0].mediaCentavos)).toBe(true);
  });
});

describe("a série e a lista de potes", () => {
  it("mês posterior ao escolhido não aparece em lugar nenhum", () => {
    // O painel deixa escolher o mês; olhando maio, junho ainda não aconteceu.
    const r = compararMeses(
      [
        mes("2026-04", 100, { casa: 100_000 }),
        mes("2026-05", 100, { casa: 200_000 }),
        mes("2026-06", 100, { casa: 900_000 }),
      ],
      "2026-05",
    );

    expect(r.media).toMatchObject({ pode: true, mesesNaMedia: 1 });
    expect(r.linhas[0].serie.map((v) => v.mes)).toEqual([
      "2026-04",
      "2026-05",
    ]);
  });

  it("a série sai em ordem, mesmo com o histórico embaralhado", () => {
    const r = compararMeses(
      [
        mes("2026-06", 100, { casa: 3 }),
        mes("2026-04", 100, { casa: 1 }),
        mes("2026-05", 100, { casa: 2 }),
      ],
      "2026-06",
    );

    expect(r.linhas[0].serie.map((v) => v.totalCentavos)).toEqual([1, 2, 3]);
  });

  it("pote ausente num mês entra com zero e puxa a média", () => {
    /*
     * A lição da B5 da spec 05: derivar a estrutura dos dados quebra quando os
     * dados acabam. Um pote que ficou zerado precisa aparecer zerado — sumir é
     * exatamente o que se quer enxergar aqui.
     */
    const r = compararMeses(
      [
        mes("2026-04", 100, { casa: 100_000 }),
        mes("2026-05", 100, { casa: 100_000, lazer: 60_000 }),
        mes("2026-06", 100, { casa: 100_000 }),
      ],
      "2026-06",
    );

    const lazer = r.linhas.find((l) => l.poteId === "lazer");

    expect(lazer).toMatchObject({
      esteMesCentavos: 0,
      mediaCentavos: 30_000,
      diferencaCentavos: -30_000,
    });
    expect(lazer?.serie).toEqual([
      { mes: "2026-04", totalCentavos: 0, confiavel: true },
      { mes: "2026-05", totalCentavos: 60_000, confiavel: true },
      { mes: "2026-06", totalCentavos: 0, confiavel: true },
    ]);
  });

  it("o mês atual abre a lista, e os anteriores completam", () => {
    const r = compararMeses(
      [
        mes("2026-05", 100, { antigo: 100 }),
        mes("2026-06", 100, { novo: 100 }),
      ],
      "2026-06",
    );

    expect(r.linhas.map((l) => l.poteId)).toEqual(["novo", "antigo"]);
  });
});
