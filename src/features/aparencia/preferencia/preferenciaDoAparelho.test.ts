import { describe, expect, it } from "vitest";
import { escolhaValida } from "./preferenciaDoAparelho";

/**
 * Os casos genéricos que antes moravam em `tema.test.ts` (spec 10, tarefa B1).
 *
 * ⚠ **Eles não saíram de lá.** `tema.test.ts` continua provando que
 * `temaEscolhido` se comporta, porque é o comportamento **daquele módulo** que
 * importa para quem lê o tema — e é ele que garante que a delegação para cá não
 * mudou nada. O que este arquivo acrescenta são os casos que só fazem sentido
 * sobre a função genérica: listas de outros tamanhos, valores de outros tipos.
 */

const CORES = ["azul", "verde"] as const;

describe("o que veio no cookie vira um dos valores da lista", () => {
  it("valor da lista passa", () => {
    expect(escolhaValida(CORES, "azul", "verde")).toBe("verde");
  });

  it("ausência é o padrão", () => {
    expect(escolhaValida(CORES, "azul", undefined)).toBe("azul");
    expect(escolhaValida(CORES, "azul", null)).toBe("azul");
    expect(escolhaValida(CORES, "azul", "")).toBe("azul");
  });

  it("valor fora da lista cai no padrão, sem exceção", () => {
    expect(escolhaValida(CORES, "azul", "roxo")).toBe("azul");
    expect(escolhaValida(CORES, "azul", "<script>")).toBe("azul");
    expect(escolhaValida(CORES, "azul", "verde; azul")).toBe("azul");
  });

  it("perdoa caixa e espaço", () => {
    expect(escolhaValida(CORES, "azul", "VERDE")).toBe("verde");
    expect(escolhaValida(CORES, "azul", "  Verde  ")).toBe("verde");
  });

  it("⚠ o padrão sai como está, mesmo fora da lista", () => {
    /*
     * Chamada errada — o padrão deveria ser um dos valores — e o remédio não é
     * lançar aqui. Quem previne isso é o teste de cada preferência, que afirma
     * `VALORES).toContain(PADRAO)`. Este teste existe para registrar que a
     * função **não** tem opinião sobre isso: ela devolve o que recebeu, e o
     * erro aparece no lugar certo em vez de virar exceção em produção por causa
     * de um cookie.
     */
    expect(escolhaValida(CORES, "roxo" as "azul", "cinza")).toBe("roxo");
  });

  it("lista vazia devolve sempre o padrão", () => {
    expect(escolhaValida([] as readonly string[], "azul", "azul")).toBe("azul");
  });
});
