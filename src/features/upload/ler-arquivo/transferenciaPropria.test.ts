import { describe, expect, it } from "vitest";
import { ehTransferenciaPropria } from "./transferenciaPropria";

/** Nome inventado — o extrato real traz o do titular nos dois lados. */
const TITULAR = "Fulano Beltrano da Silva";

describe("ehTransferenciaPropria", () => {
  it("reconhece o Pix recebido de si mesmo", () => {
    expect(
      ehTransferenciaPropria(
        'Pix recebido: "Cp :00000000-Fulano Beltrano da Silva"',
        TITULAR,
      ),
    ).toBe(true);
  });

  it("reconhece a transferência enviada para a própria corretora", () => {
    expect(
      ehTransferenciaPropria(
        'Transferencia enviada: "102 0001 0000000 Fulano Beltrano da Silva"',
        TITULAR,
      ),
    ).toBe(true);
  });

  it("ignora caixa, acento e a partícula que o banco corta", () => {
    expect(
      ehTransferenciaPropria("PIX RECEBIDO FULANO BELTRANO SILVA", TITULAR),
    ).toBe(true);
    expect(ehTransferenciaPropria("Pix de Júlia Mãe", "Julia Mae")).toBe(true);
  });

  it("não reconhece outra pessoa", () => {
    expect(
      ehTransferenciaPropria(
        'Pix recebido: "Cp :00000000-Ciclana Beltrano da Silva"',
        TITULAR,
      ),
    ).toBe(false);
  });

  it("exige todas as palavras: duas soltas casariam com um parente", () => {
    // Um falso positivo aqui tira dinheiro real da conta.
    expect(ehTransferenciaPropria("Pix: Fulano Silva Junior", TITULAR)).toBe(
      false,
    );
  });

  it("palavra inteira, não pedaço de palavra", () => {
    expect(
      ehTransferenciaPropria("Pix: Fulanoide Beltranoso Silvana", TITULAR),
    ).toBe(false);
  });

  it("nome de uma palavra só nunca casa", () => {
    expect(ehTransferenciaPropria("Pix para Davi", "Davi")).toBe(false);
  });

  it("sem nome do titular, nada é transferência própria", () => {
    expect(ehTransferenciaPropria("Pix: Fulano Beltrano Silva", null)).toBe(
      false,
    );
    expect(ehTransferenciaPropria("Pix: Fulano Beltrano Silva", "")).toBe(
      false,
    );
  });

  it("falha para o lado antigo quando o banco imprime um nome mais curto", () => {
    // Clerk com o nome completo, banco com o nome abreviado: não casa, e o
    // comportamento volta a ser o de antes — nunca o de esconder dinheiro.
    expect(
      ehTransferenciaPropria("Pix recebido: Fulano Beltrano", TITULAR),
    ).toBe(false);
  });
});
