import { describe, expect, it } from "vitest";
import type { Cobertura } from "@/features/painel/somar-o-mes/cobertura";
import type { PoteNoPainel } from "./poteNoPainel";
import { vereditoDoPainel } from "./vereditoDoPainel";

const RENDA = 400_000;

const cobertura: Cobertura = {
  saiuPct: 100,
  entrouPct: null,
  completa: true,
};

const pote = (p: Partial<PoteNoPainel>): PoteNoPainel => ({
  id: "p",
  slug: "lazer",
  nome: "Lazer",
  emoji: "🎉",
  cor: "#000000",
  tipo: "gasto",
  percentual: 30,
  observacao: null,
  totalCentavos: 0,
  lancamentos: 1,
  categorias: [],
  lista: [],
  ...p,
});

const entrada = (p: Partial<Parameters<typeof vereditoDoPainel>[0]>) => ({
  cobertura,
  rendaCentavos: RENDA,
  saiuCentavos: 200_000,
  potes: [] as PoteNoPainel[],
  ...p,
});

describe("vereditoDoPainel", () => {
  it("potes de renda são ignorados, mesmo que estourassem a meta", () => {
    // Se o pote de renda entrasse, 200 mil contra meta de 120 mil daria
    // "pote" com grau de estouro. Ignorado, o mês fecha dentro.
    const veredito = vereditoDoPainel(
      entrada({
        potes: [
          pote({
            nome: "Salário",
            tipo: "renda",
            totalCentavos: 200_000,
          }),
          pote({ nome: "Mercado", totalCentavos: 80_000 }),
        ],
      }),
    );

    expect(veredito?.grau).toBe("dentro");
  });

  it("pote de gasto sem meta nunca vira candidato a estouro", () => {
    const veredito = vereditoDoPainel(
      entrada({
        potes: [pote({ percentual: null, totalCentavos: 500_000 })],
      }),
    );

    expect(veredito?.grau).toBe("dentro");
  });

  it("sem renda declarada não há veredito", () => {
    const veredito = vereditoDoPainel(
      entrada({
        rendaCentavos: null,
        potes: [pote({ totalCentavos: 150_000 })],
      }),
    );

    expect(veredito).toBeNull();
  });

  it("com meta e estouro, aponta o pote que destoou", () => {
    // Meta = 30% de 400 mil = 120 mil. Gasto de 150 mil excede em 30 mil,
    // acima do piso de 5% da renda (20 mil).
    const veredito = vereditoDoPainel(
      entrada({
        potes: [pote({ nome: "Lazer", totalCentavos: 150_000 })],
      }),
    );

    expect(veredito?.grau).toBe("pote");
    expect(veredito?.frase).toContain("Lazer");
  });
});
