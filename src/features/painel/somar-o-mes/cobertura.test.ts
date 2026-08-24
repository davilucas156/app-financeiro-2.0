import { describe, expect, it } from "vitest";
import {
  coberturaConfiavel,
  coberturaDoMes,
  COBERTURA_CONFIAVEL_PCT,
  type Cobertura,
} from "./cobertura";
import type { SomaDoMes } from "./somarOMes";

const soma = (p: Partial<SomaDoMes>): SomaDoMes => ({
  potes: [],
  entrouCentavos: 0,
  saiuCentavos: 0,
  diferencaCentavos: 0,
  lancamentos: 0,
  saiuClassificadoCentavos: 0,
  entrouClassificadoCentavos: 0,
  ...p,
});

describe("a cobertura em dinheiro (A2)", () => {
  it("mede dinheiro, não lançamentos", () => {
    /*
     * O caso real do Davi, em proporção: 32 pendentes de 33 lançamentos, mas o
     * único classificado pesava tanto quanto quase dois terços do mês. Contagem
     * e dinheiro contam histórias diferentes.
     */
    const c = coberturaDoMes(
      soma({ saiuCentavos: 100_000, saiuClassificadoCentavos: 63_000 }),
    );

    expect(c.saiuPct).toBe(63);
    expect(c.completa).toBe(false);
  });

  it("tudo classificado é 100 e completa", () => {
    const c = coberturaDoMes(
      soma({
        saiuCentavos: 50_000,
        saiuClassificadoCentavos: 50_000,
        entrouCentavos: 120_000,
        entrouClassificadoCentavos: 120_000,
      }),
    );

    expect(c.saiuPct).toBe(100);
    expect(c.entrouPct).toBe(100);
    expect(c.completa).toBe(true);
  });
});

describe("o arredondamento não pode anunciar o fim do trabalho", () => {
  it("⚠ 99,6% mostra 99, não 100", () => {
    const c = coberturaDoMes(
      soma({ saiuCentavos: 100_000, saiuClassificadoCentavos: 99_600 }),
    );

    expect(c.saiuPct).toBe(99);
    expect(c.completa).toBe(false);
  });

  it("⚠ `completa` vem dos centavos, não da porcentagem", () => {
    // Um centavo de fora ainda é dinheiro de fora.
    const c = coberturaDoMes(
      soma({ saiuCentavos: 100_000, saiuClassificadoCentavos: 99_999 }),
    );

    expect(c.saiuPct).toBe(99);
    expect(c.completa).toBe(false);
  });

  it("0,4% mostra 1, não 0", () => {
    // Dizer "0%" quando já existe algo classificado é a mentira invertida.
    const c = coberturaDoMes(
      soma({ saiuCentavos: 100_000, saiuClassificadoCentavos: 400 }),
    );

    expect(c.saiuPct).toBe(1);
  });

  it("nada classificado é 0 de verdade", () => {
    const c = coberturaDoMes(
      soma({ saiuCentavos: 100_000, saiuClassificadoCentavos: 0 }),
    );

    expect(c.saiuPct).toBe(0);
  });
});

describe("mês sem dinheiro numa direção", () => {
  it("devolve null em vez de 100", () => {
    // "100% de nada" parece uma garantia e não é nenhuma.
    const c = coberturaDoMes(
      soma({ saiuCentavos: 30_000, saiuClassificadoCentavos: 30_000 }),
    );

    expect(c.entrouPct).toBeNull();
    // Sem entrada, não há entrada descoberta: o mês está completo.
    expect(c.completa).toBe(true);
  });

  it("mês inteiramente vazio é completo e sem porcentagem", () => {
    const c = coberturaDoMes(soma({}));

    expect(c).toEqual({ saiuPct: null, entrouPct: null, completa: true });
  });
});

describe("dá para dizer alguma coisa sobre este mês? (A1)", () => {
  const com = (saiuPct: number | null): Cobertura => ({
    saiuPct,
    entrouPct: null,
    completa: false,
  });

  it("no limiar exato, confia", () => {
    expect(coberturaConfiavel(com(COBERTURA_CONFIAVEL_PCT))).toBe(true);
  });

  it("um ponto abaixo, não confia", () => {
    expect(coberturaConfiavel(com(COBERTURA_CONFIAVEL_PCT - 1))).toBe(false);
  });

  it("nada saiu não é confiável — e não quer dizer mal classificado", () => {
    /*
     * Quem interpreta este `false` é quem chamou: o `vereditoDoMes` se cala
     * antes de chegar aqui, porque um mês sem gasto não é um mês para mandar
     * revisar.
     */
    expect(coberturaConfiavel(com(null))).toBe(false);
  });

  it("ignora a cobertura de entrada", () => {
    /*
     * A medição da spec 04 achou cobertura muito menor no que entra do que no
     * que sai, e a assimetria é estrutural: renda quase não é classificada.
     * Exigir os dois lados travaria todo mês no degrau 1, para sempre.
     */
    const rendaCrua: Cobertura = {
      saiuPct: 100,
      entrouPct: 10,
      completa: false,
    };

    expect(coberturaConfiavel(rendaCrua)).toBe(true);
  });
});
