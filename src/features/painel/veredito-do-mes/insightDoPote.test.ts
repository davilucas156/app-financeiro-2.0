import { describe, expect, it } from "vitest";
import { insightDoPote, type PoteNoInsight } from "./insightDoPote";

const pote = (p: Partial<PoteNoInsight>): PoteNoInsight => ({
  tipo: "gasto",
  totalCentavos: 100_000,
  lancamentos: 3,
  categorias: [],
  ...p,
});

describe("a distância da meta, em dinheiro", () => {
  it("acima da meta diz quanto acima", () => {
    // A metade que existe porque 708% não cabe numa barra.
    const r = insightDoPote(pote({ totalCentavos: 310_000 }), {
      metaCentavos: 100_000,
    });

    expect(r).toBe("R$ 2.100,00 acima da meta");
  });

  it("abaixo da meta diz quanto abaixo", () => {
    const r = insightDoPote(pote({ totalCentavos: 70_000 }), {
      metaCentavos: 100_000,
    });

    expect(r).toBe("R$ 300,00 abaixo da meta");
  });

  it("exatamente na meta não vira 'R$ 0,00 acima'", () => {
    const r = insightDoPote(pote({ totalCentavos: 100_000 }), {
      metaCentavos: 100_000,
    });

    expect(r).toBe("Fechou exatamente na meta");
  });

  it("pote de renda troca 'meta' por 'previsto'", () => {
    // Sinal, não julgamento: acima é bom aqui, e a frase não comemora nem cobra.
    const r = insightDoPote(
      pote({ tipo: "renda", totalCentavos: 180_000 }),
      { metaCentavos: 100_000 },
    );

    expect(r).toBe("R$ 800,00 acima do previsto");
  });
});

describe("a categoria que domina", () => {
  it("não sai no limiar exato", () => {
    const r = insightDoPote(
      pote({
        totalCentavos: 100_000,
        categorias: [
          { nome: "Gasolina", totalCentavos: 50_000 },
          { nome: "Ônibus", totalCentavos: 50_000 },
        ],
      }),
      { metaCentavos: 100_000 },
    );

    expect(r).toBe("Fechou exatamente na meta");
  });

  it("sai um centésimo acima do limiar", () => {
    /*
     * A fronteira medida: a menor concentração encontrada nos potes reais foi
     * de pouco mais da metade, e ela precisa disparar.
     */
    const r = insightDoPote(
      pote({
        totalCentavos: 100_000,
        categorias: [
          { nome: "Gasolina", totalCentavos: 51_000 },
          { nome: "Ônibus", totalCentavos: 49_000 },
        ],
      }),
      { metaCentavos: 100_000 },
    );

    expect(r).toBe("Fechou exatamente na meta · Gasolina é 51% dele");
  });

  it("categoria única vira 'tudo em'", () => {
    const r = insightDoPote(
      pote({
        totalCentavos: 120_000,
        categorias: [{ nome: "Gasolina", totalCentavos: 120_000 }],
      }),
      { metaCentavos: 100_000 },
    );

    expect(r).toBe("R$ 200,00 acima da meta · tudo em Gasolina");
  });

  it("99,6% não vira 'tudo'", () => {
    // Mesma régua da cobertura: não anunciar o absoluto enquanto sobrar dinheiro.
    const r = insightDoPote(
      pote({
        totalCentavos: 100_000,
        categorias: [
          { nome: "Gasolina", totalCentavos: 99_600 },
          { nome: "Ônibus", totalCentavos: 400 },
        ],
      }),
      { metaCentavos: 100_000 },
    );

    expect(r).toContain("Gasolina é 99% dele");
    expect(r).not.toContain("tudo em");
  });

  it("empate fica com a primeira", () => {
    // A frase não pode oscilar entre dois renders da mesma tela.
    const r = insightDoPote(
      pote({
        totalCentavos: 100_000,
        categorias: [
          { nome: "Primeira", totalCentavos: 60_000 },
          { nome: "Segunda", totalCentavos: 60_000 },
        ],
      }),
      { metaCentavos: 100_000 },
    );

    expect(r).toContain("Primeira");
  });

  it("sem categoria nenhuma, só a primeira metade", () => {
    const r = insightDoPote(pote({ totalCentavos: 150_000, categorias: [] }), {
      metaCentavos: 100_000,
    });

    expect(r).toBe("R$ 500,00 acima da meta");
  });
});

describe("as quatro recusas", () => {
  it("pote sem meta cala a boca", () => {
    // Descoberta 3. Não é um pote que fechou dentro; é um que não tem dentro.
    expect(
      insightDoPote(pote({ totalCentavos: 21_600 }), { metaCentavos: null }),
    ).toBeNull();
  });

  it("meta calculada em zero cala a boca", () => {
    // Renda declarada zerada: o infinito por cento por outro caminho.
    expect(
      insightDoPote(pote({ totalCentavos: 21_600 }), { metaCentavos: 0 }),
    ).toBeNull();
  });

  it("pote vazio cala a boca", () => {
    expect(
      insightDoPote(pote({ lancamentos: 0, totalCentavos: 0 }), {
        metaCentavos: 100_000,
      }),
    ).toBeNull();
  });

  it("pote negativo cala a boca", () => {
    /*
     * "R$ 400 abaixo da meta" seria verdade aritmética e mentira de sentido:
     * ninguém economizou nada, um reembolso passou o gasto.
     */
    expect(
      insightDoPote(pote({ totalCentavos: -40_000 }), {
        metaCentavos: 100_000,
      }),
    ).toBeNull();
  });
});
