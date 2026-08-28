import { describe, expect, it } from "vitest";
import { estadoDoPote, legendaDoPote } from "./poteNoPainel";

const pote = (p: Partial<Parameters<typeof estadoDoPote>[0]>) => ({
  percentual: 30 as number | null,
  totalCentavos: 10_000,
  lancamentos: 2,
  ...p,
});

const META = 36_000;

describe("os quatro estados que a tela distingue sem ler o número (B2)", () => {
  it("vazio: nada caiu aqui", () => {
    expect(estadoDoPote(pote({ totalCentavos: 0, lancamentos: 0 }), META)).toBe(
      "vazio",
    );
  });

  it("negativo: devolveram mais do que saiu", () => {
    expect(estadoDoPote(pote({ totalCentavos: -2_000 }), META)).toBe(
      "negativo",
    );
  });

  it("sem meta: o pote não tem percentual", () => {
    expect(estadoDoPote(pote({ percentual: null }), null)).toBe("sem-meta");
  });

  it("estourado: passou da meta", () => {
    expect(estadoDoPote(pote({ totalCentavos: 45_000 }), META)).toBe(
      "estourado",
    );
  });

  it("normal: dentro da meta", () => {
    expect(estadoDoPote(pote({ totalCentavos: 10_000 }), META)).toBe("normal");
  });

  it("exatamente na meta ainda é normal", () => {
    expect(estadoDoPote(pote({ totalCentavos: META }), META)).toBe("normal");
  });
});

describe("a ordem das perguntas importa", () => {
  it("⚠ pote sem lançamento nenhum é vazio, e não estourado", () => {
    // Com renda declarada zerada a meta é 0, e um pote vazio "passaria" dela.
    // Vazio tem de vir antes de comparar com meta nenhuma.
    expect(estadoDoPote(pote({ totalCentavos: 0, lancamentos: 0 }), 0)).toBe(
      "vazio",
    );
  });

  it("⚠ pote sem meta e negativo é negativo — o estado mais informativo vence", () => {
    // "sem meta" diz o que falta ao pote; "negativo" diz o que aconteceu com o
    // dinheiro. O segundo é o que a pessoa precisa ver.
    expect(
      estadoDoPote(pote({ percentual: null, totalCentavos: -500 }), null),
    ).toBe("negativo");
  });
});

describe("a legenda embaixo da barra", () => {
  const p = { observacao: "eventual", tipo: "gasto" as const };

  it("⚠ pote sem meta NUNCA mostra 0%", () => {
    // `potes-padrao.ts` é explícito. Sem meta não há percentual a mostrar —
    // há uma observação, que é outra coisa.
    const legenda = legendaDoPote("sem-meta", p, null);

    expect(legenda).toBe("eventual");
    expect(legenda).not.toContain("%");
  });

  it("pote sem meta e sem observação cai num texto honesto", () => {
    expect(legendaDoPote("sem-meta", { ...p, observacao: null }, null)).toBe(
      "sem meta",
    );
  });

  it("vazio diz que nada caiu ali, e não 'R$ 0,00'", () => {
    expect(legendaDoPote("vazio", p, 0)).toBe("nada caiu aqui este mês");
  });

  it("negativo explica o que aconteceu", () => {
    expect(legendaDoPote("negativo", p, 0)).toBe("devolveram mais do que saiu");
  });

  it("normal e estourado mostram a fração da meta", () => {
    expect(legendaDoPote("normal", p, 0.4)).toBe("40% da meta");
    expect(legendaDoPote("estourado", p, 1.25)).toBe("125% da meta");
  });
});
