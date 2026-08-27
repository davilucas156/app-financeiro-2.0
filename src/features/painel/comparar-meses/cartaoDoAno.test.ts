import { describe, expect, it } from "vitest";
import { cartoesDoAno } from "./cartaoDoAno";
import type { LinhaDoComparativo, ValorNoMes } from "./comparativo";

function valor(
  mes: string,
  totalCentavos: number,
  confiavel = true,
): ValorNoMes {
  return { mes, totalCentavos, confiavel };
}

function linha(poteId: string, serie: ValorNoMes[]): LinhaDoComparativo {
  return {
    poteId,
    esteMesCentavos: serie.at(-1)?.totalCentavos ?? 0,
    mediaCentavos: null,
    diferencaCentavos: null,
    serie,
  };
}

describe("cartoesDoAno", () => {
  it("devolve vazio sem linha nenhuma", () => {
    expect(cartoesDoAno([])).toEqual([]);
  });

  it("com um mês, o total é aquele mês e a média é igual a ele", () => {
    const [cartao] = cartoesDoAno([linha("a", [valor("2026-01", 30000)])]);

    expect(cartao.totalCentavos).toBe(30000);
    expect(cartao.mediaMensalCentavos).toBe(30000);
    expect(cartao.mesesComDado).toBe(1);
  });

  it("soma o ano e divide pelos meses com dado", () => {
    const [cartao] = cartoesDoAno([
      linha("a", [
        valor("2026-01", 40000),
        valor("2026-02", 30000),
        valor("2026-03", 20000),
      ]),
    ]);

    expect(cartao.totalCentavos).toBe(90000);
    expect(cartao.mediaMensalCentavos).toBe(30000);
    expect(cartao.mesesComDado).toBe(3);
  });

  /*
   * ⚠ **A defesa contra o número que muda sozinho.** Dividir por 12 daria
   * R$ 75,00/mês num pote que gastou R$ 300,00 em cada um dos três meses
   * importados — e o número cairia de novo a cada mês que passasse sem importar.
   */
  it("não divide por 12", () => {
    const [cartao] = cartoesDoAno([
      linha("a", [
        valor("2026-01", 30000),
        valor("2026-02", 30000),
        valor("2026-03", 30000),
      ]),
    ]);

    expect(cartao.mediaMensalCentavos).toBe(30000);
    expect(cartao.mediaMensalCentavos).not.toBe(Math.round(90000 / 12));
  });

  /*
   * ⚠ B5 da spec 05, e o `historicoDosMeses` já a repete: num painel, pote
   * vazio é uma linha zerada; num comparativo, é o dado. "Você não gastou nada
   * em Conhecimento o ano inteiro" só pode ser lido se a linha estiver lá.
   */
  it("mantém o pote que ficou zerado o ano inteiro", () => {
    const [cartao] = cartoesDoAno([
      linha("vazio", [valor("2026-01", 0), valor("2026-02", 0)]),
    ]);

    expect(cartao.totalCentavos).toBe(0);
    expect(cartao.mediaMensalCentavos).toBe(0);
    expect(cartao.mesesComDado).toBe(2);
  });

  it("marca o cartão que tem mês pouco classificado", () => {
    const [cartao] = cartoesDoAno([
      linha("a", [valor("2026-01", 30000), valor("2026-02", 10000, false)]),
    ]);

    expect(cartao.temMesPoucoClassificado).toBe(true);
  });

  it("não marca o cartão com todos os meses confiáveis", () => {
    const [cartao] = cartoesDoAno([
      linha("a", [valor("2026-01", 30000), valor("2026-02", 10000)]),
    ]);

    expect(cartao.temMesPoucoClassificado).toBe(false);
  });

  /*
   * ⚠ **Mês pouco classificado entra nos dois lados, ou em nenhum.** Se ele
   * saísse da média e ficasse no total, `total ÷ meses` deixaria de dar
   * `média` — e o cartão mostraria dois números que se desmentem.
   */
  it("conta o mês pouco classificado no total e na média", () => {
    const [cartao] = cartoesDoAno([
      linha("a", [valor("2026-01", 30000), valor("2026-02", 10000, false)]),
    ]);

    expect(cartao.totalCentavos).toBe(40000);
    expect(cartao.mediaMensalCentavos).toBe(20000);
  });

  it("a média nunca sai fracionada", () => {
    const [cartao] = cartoesDoAno([
      linha("a", [
        valor("2026-01", 10000),
        valor("2026-02", 10001),
        valor("2026-03", 10001),
      ]),
    ]);

    expect(Number.isInteger(cartao.mediaMensalCentavos)).toBe(true);
  });

  it("um cartão por linha, na mesma ordem", () => {
    const cartoes = cartoesDoAno([
      linha("primeiro", [valor("2026-01", 100)]),
      linha("segundo", [valor("2026-01", 200)]),
    ]);

    expect(cartoes.map((c) => c.poteId)).toEqual(["primeiro", "segundo"]);
  });

  /*
   * A promessa que a E1 vai guardar contra o futuro: a série do cartão **é** a
   * série da barra, e não uma cópia recalculada.
   */
  it("a soma da série bate com o total, no centavo", () => {
    const serie = [
      valor("2026-01", 54187),
      valor("2026-02", 14000),
      valor("2026-03", 35204, false),
    ];
    const [cartao] = cartoesDoAno([linha("a", serie)]);

    const soma = cartao.serie.reduce((s, v) => s + v.totalCentavos, 0);

    expect(soma).toBe(cartao.totalCentavos);
    expect(cartao.serie).toBe(serie);
  });
});
