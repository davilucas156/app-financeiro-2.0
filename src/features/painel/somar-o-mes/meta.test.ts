import { describe, expect, it } from "vitest";
import { metaDoPote } from "./meta";

/** R$ 1.200 — a base do painel HTML do Davi, já em `potes-padrao.ts`. */
const RENDA = 120_000;

const m = (p: Partial<Parameters<typeof metaDoPote>[0]>) =>
  metaDoPote({
    percentual: 30,
    rendaDeclaradaCentavos: RENDA,
    totalCentavos: 0,
    lancamentos: 1,
    ...p,
  });

describe("a meta sai da renda declarada", () => {
  it("reproduz os valores do painel original do Davi", () => {
    // 30/25/15/15/10/5% sobre R$1.200 = 360/300/180/180/120/60, que é
    // exatamente o que `potes-padrao.ts` guarda em `metaReferenciaCentavos`.
    const meta = (pct: number) => m({ percentual: pct }).metaCentavos;

    expect(meta(30)).toBe(36_000);
    expect(meta(25)).toBe(30_000);
    expect(meta(15)).toBe(18_000);
    expect(meta(10)).toBe(12_000);
    expect(meta(5)).toBe(6_000);
  });

  it("centavos inteiros, mesmo com renda quebrada", () => {
    expect(m({ percentual: 15, rendaDeclaradaCentavos: 333_333 }).metaCentavos)
      .toBe(50_000);
  });
});

describe("os quatro estados que a tela distingue sem ler o número", () => {
  it("pote sem percentual não tem meta nem barra", () => {
    // Manutenção e Outros/Repasses. `potes-padrao.ts`: nunca mostrar "0%".
    const r = m({ percentual: null, totalCentavos: 9_000 });

    expect(r.metaCentavos).toBeNull();
    expect(r.fracao).toBeNull();
    expect(r.estourou).toBe(false);
  });

  it("pote vazio é zero de verdade", () => {
    // Diferente de "não foi classificado", que a cobertura da A2 responde.
    expect(m({ totalCentavos: 0, lancamentos: 0 }).vazio).toBe(true);
    expect(m({ totalCentavos: 0, lancamentos: 3 }).vazio).toBe(false);
  });

  it("pote negativo zera a barra e continua negativo", () => {
    const r = m({ totalCentavos: -2_000 });

    expect(r.negativo).toBe(true);
    // Barra que anda para trás não existe; o número ao lado mostra o negativo.
    expect(r.fracao).toBe(0);
    expect(r.estourou).toBe(false);
  });

  it("pote estourado passa de 100%", () => {
    const r = m({ totalCentavos: 45_000 });

    expect(r.estourou).toBe(true);
    expect(r.fracao).toBeCloseTo(1.25);
  });

  it("exatamente na meta ainda não estourou", () => {
    const r = m({ totalCentavos: 36_000 });

    expect(r.estourou).toBe(false);
    expect(r.fracao).toBe(1);
  });
});

describe("sem renda declarada", () => {
  it("mostra o gasto e não inventa meta", () => {
    // Inventar uma base seria inventar a renda dele.
    const r = m({ rendaDeclaradaCentavos: null, totalCentavos: 20_000 });

    expect(r.metaCentavos).toBeNull();
    expect(r.fracao).toBeNull();
    expect(r.estourou).toBe(false);
  });

  it("renda declarada zerada: sem barra, mas gasto ainda estoura", () => {
    const r = m({ rendaDeclaradaCentavos: 0, totalCentavos: 500 });

    expect(r.metaCentavos).toBe(0);
    expect(r.fracao).toBeNull();
    expect(r.estourou).toBe(true);
  });
});
