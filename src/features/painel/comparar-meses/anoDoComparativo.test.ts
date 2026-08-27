import { describe, expect, it } from "vitest";
import { anoEscolhido, anosDoHistorico, mesesDoAno } from "./anoDoComparativo";
import type { MesComCobertura } from "./comparativo";

function mes(m: string, coberturaSaiuPct: number | null = 90): MesComCobertura {
  return { mes: m, coberturaSaiuPct };
}

describe("anosDoHistorico", () => {
  it("devolve vazio quando a conta não tem mês nenhum", () => {
    expect(anosDoHistorico([])).toEqual([]);
  });

  it("não repete o ano que aparece em vários meses", () => {
    const meses = [mes("2026-01"), mes("2026-02"), mes("2026-03")];

    expect(anosDoHistorico(meses)).toEqual(["2026"]);
  });

  it("devolve os dois anos, do mais antigo ao mais novo, na virada", () => {
    const meses = [mes("2025-12"), mes("2026-01")];

    expect(anosDoHistorico(meses)).toEqual(["2025", "2026"]);
  });

  /*
   * ⚠ Ordena o resultado, e não confia na ordem da entrada. O
   * `historicoDosMeses` entrega ordenado hoje; um `group by` que mude de plano
   * amanhã não pode virar um seletor com 2026 antes de 2025.
   */
  it("ordena mesmo recebendo os meses fora de ordem", () => {
    const meses = [mes("2026-03"), mes("2024-07"), mes("2025-11")];

    expect(anosDoHistorico(meses)).toEqual(["2024", "2025", "2026"]);
  });
});

describe("anoEscolhido", () => {
  const meses = [mes("2025-12"), mes("2026-01"), mes("2026-02")];

  it("sem pedido, abre no ano do mês de referência", () => {
    expect(anoEscolhido(meses, "2026-02", undefined)).toBe("2026");
    expect(anoEscolhido(meses, "2025-12", undefined)).toBe("2025");
  });

  it("aceita o pedido quando a conta tem mês naquele ano", () => {
    expect(anoEscolhido(meses, "2026-02", "2025")).toBe("2025");
  });

  it("recusa ano que a conta não tem, e cai no do mês de referência", () => {
    expect(anoEscolhido(meses, "2026-02", "2019")).toBe("2026");
  });

  it("trata `null` como ausência de pedido", () => {
    expect(anoEscolhido(meses, "2026-02", null)).toBe("2026");
  });

  /*
   * ⚠ **O valor vem da URL, e a URL aceita qualquer coisa.** Sem esta recusa, o
   * ano chegaria ao `mesesDoAno` e devolveria uma tela vazia — indistinguível
   * de um mês que não foi importado.
   */
  it("recusa lixo sem virar consulta", () => {
    expect(anoEscolhido(meses, "2026-02", "<script>")).toBe("2026");
    expect(anoEscolhido(meses, "2026-02", "")).toBe("2026");
    expect(anoEscolhido(meses, "2026-02", "2026-01")).toBe("2026");
  });

  it("sem histórico, ainda devolve o ano do mês de referência", () => {
    expect(anoEscolhido([], "2026-02", "2026")).toBe("2026");
  });
});

describe("mesesDoAno", () => {
  const meses = [
    mes("2025-11"),
    mes("2025-12"),
    mes("2026-01"),
    mes("2026-02"),
  ];

  it("fica só com os meses do ano pedido", () => {
    expect(mesesDoAno(meses, "2026").map((m) => m.mes)).toEqual([
      "2026-01",
      "2026-02",
    ]);
  });

  it("devolve vazio para um ano sem mês", () => {
    expect(mesesDoAno(meses, "2019")).toEqual([]);
  });

  /*
   * O recorte preserva o objeto inteiro: quem chama passa `MesNoHistorico`, com
   * o gasto por pote, e precisa recebê-lo de volta com os potes dentro.
   */
  it("preserva os campos além do mês", () => {
    const comPotes = [
      {
        mes: "2026-01",
        coberturaSaiuPct: 80,
        potes: [{ poteId: "a", totalCentavos: 100 }],
      },
      {
        mes: "2025-01",
        coberturaSaiuPct: 80,
        potes: [{ poteId: "a", totalCentavos: 900 }],
      },
    ];

    expect(mesesDoAno(comPotes, "2026")).toEqual([comPotes[0]]);
  });
});
