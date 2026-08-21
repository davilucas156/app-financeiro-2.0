import { describe, expect, it } from "vitest";
import {
  paresDeValorIdentico,
  type LancamentoParaParear,
} from "./paresDeValorIdentico";

const l = (
  id: string,
  valorCentavos: number,
  direcao: LancamentoParaParear["direcao"],
): LancamentoParaParear => ({ id, valorCentavos, direcao });

describe("o par de valor idêntico dentro do pote (A4)", () => {
  it("entrada e saída do mesmo valor pedem conferência", () => {
    // Pode ser reembolso de verdade, ou a mesma transferência nos dois
    // arquivos. O app não decide — marca para o Davi olhar.
    const marcados = paresDeValorIdentico([
      l("saida", 10_000, "saida"),
      l("entrada", 10_000, "entrada"),
    ]);

    expect([...marcados].sort()).toEqual(["entrada", "saida"]);
  });

  it("valores diferentes não marcam nada", () => {
    // Abate parcial é abate normal, sem ambiguidade nenhuma.
    const marcados = paresDeValorIdentico([
      l("a", 10_000, "saida"),
      l("b", 4_000, "entrada"),
    ]);

    expect(marcados.size).toBe(0);
  });

  it("só saídas não marcam nada", () => {
    const marcados = paresDeValorIdentico([
      l("a", 5_000, "saida"),
      l("b", 5_000, "saida"),
      l("c", 5_000, "saida"),
    ]);

    expect(marcados.size).toBe(0);
  });

  it("⚠ marca TODOS do mesmo valor, e não um par escolhido", () => {
    /*
     * Com duas saídas de R$50 e uma entrada de R$50, a entrada pode
     * corresponder a qualquer uma das duas. Escolher uma seria arbitrário e
     * erraria metade das vezes; marcar as três diz "olhe estas".
     */
    const marcados = paresDeValorIdentico([
      l("s1", 5_000, "saida"),
      l("s2", 5_000, "saida"),
      l("e1", 5_000, "entrada"),
    ]);

    expect([...marcados].sort()).toEqual(["e1", "s1", "s2"]);
  });

  it("separa por valor: um par não contamina o outro", () => {
    const marcados = paresDeValorIdentico([
      l("a1", 5_000, "saida"),
      l("a2", 5_000, "entrada"),
      l("b1", 9_900, "saida"),
    ]);

    expect([...marcados].sort()).toEqual(["a1", "a2"]);
  });

  it("lista vazia devolve conjunto vazio", () => {
    expect(paresDeValorIdentico([]).size).toBe(0);
  });
});
