import { describe, expect, it } from "vitest";
import { FORMATOS_DE_DATA, FORMATOS_DE_NUMERO } from "./dialetos";
import { paraCentavos, paraDataISO } from "./lancamentos";

/**
 * Os dialetos de data e de número (spec 11, tarefas A1 e A2).
 *
 * ⚠ **O que prova que a fase A não mudou nada não está aqui** — está em
 * `lancamentos.test.ts`, que passa sem uma linha alterada. Este arquivo cobre
 * só o que passou a existir.
 */

describe("paraDataISO com formato declarado", () => {
  it("lê os quatro formatos", () => {
    expect(paraDataISO("31/12/2026", "dd/mm/aaaa")).toBe("2026-12-31");
    expect(paraDataISO("31-12-2026", "dd-mm-aaaa")).toBe("2026-12-31");
    expect(paraDataISO("2026-12-31", "aaaa-mm-dd")).toBe("2026-12-31");
    expect(paraDataISO("12/31/2026", "mm/dd/aaaa")).toBe("2026-12-31");
  });

  /*
   * ⚠ **O erro que não tem sintoma.** A mesma célula lida com duas réguas dá
   * dois meses diferentes, e nenhuma das duas leituras dá erro. Sinal trocado
   * aparece num total; isto move o lançamento de mês, e o mês é o eixo do
   * painel, do comparativo e da média.
   */
  it("a mesma célula ambígua vira meses diferentes, conforme a régua", () => {
    expect(paraDataISO("01/02/2026", "dd/mm/aaaa")).toBe("2026-02-01");
    expect(paraDataISO("01/02/2026", "mm/dd/aaaa")).toBe("2026-01-02");
  });

  it("recusa data que não existe, em todos os formatos", () => {
    expect(paraDataISO("31/02/2026", "dd/mm/aaaa")).toBeNull();
    expect(paraDataISO("31-02-2026", "dd-mm-aaaa")).toBeNull();
    expect(paraDataISO("2026-02-31", "aaaa-mm-dd")).toBeNull();
    expect(paraDataISO("02/31/2026", "mm/dd/aaaa")).toBeNull();
  });

  it("recusa a data escrita no formato errado", () => {
    expect(paraDataISO("2026-12-31", "dd/mm/aaaa")).toBeNull();
    expect(paraDataISO("31/12/2026", "aaaa-mm-dd")).toBeNull();
    expect(paraDataISO("31/12/2026", "dd-mm-aaaa")).toBeNull();
  });

  it("sem formato, continua sendo o do Inter", () => {
    expect(paraDataISO("02/06/2026")).toBe("2026-06-02");
    expect(paraDataISO("2026-06-02")).toBeNull();
  });

  it("todo formato da lista é lido por alguma célula", () => {
    const amostras: Record<string, string> = {
      "dd/mm/aaaa": "25/12/2026",
      "dd-mm-aaaa": "25-12-2026",
      "aaaa-mm-dd": "2026-12-25",
      "mm/dd/aaaa": "12/25/2026",
    };

    for (const f of FORMATOS_DE_DATA) {
      expect(paraDataISO(amostras[f], f)).toBe("2026-12-25");
    }
  });
});

describe("paraCentavos com convenção declarada", () => {
  it("lê pt-BR e en-US", () => {
    expect(paraCentavos("1.200,50", "pt-BR")).toBe(120050);
    expect(paraCentavos("1,200.50", "en-US")).toBe(120050);
  });

  it("lê o negativo nas duas", () => {
    expect(paraCentavos("-318,19", "pt-BR")).toBe(-31819);
    expect(paraCentavos("-318.19", "en-US")).toBe(-31819);
  });

  /*
   * ⚠ **`1.200` é a armadilha simétrica da data.** Em pt-BR é mil e duzentos;
   * em en-US seria um e dois décimos — e três casas decimais não é centavo, o
   * que faz a leitura ser **recusada** em vez de arredondada. Ignorar em voz
   * alta é melhor que ler mil vezes errado em silêncio.
   */
  it("recusa três casas depois do separador decimal, nas duas", () => {
    expect(paraCentavos("1.200", "en-US")).toBeNull();
    expect(paraCentavos("1,200", "pt-BR")).toBeNull();
  });

  it("o mesmo texto vale mil vezes mais numa convenção do que na outra", () => {
    expect(paraCentavos("1.200,00", "pt-BR")).toBe(120000);
    expect(paraCentavos("1200.00", "en-US")).toBe(120000);
  });

  it("tira o cifrão sozinho, além do R$", () => {
    expect(paraCentavos("$1,200.50", "en-US")).toBe(120050);
    expect(paraCentavos("R$ 15,00", "pt-BR")).toBe(1500);
  });

  it("sem convenção, continua sendo pt-BR", () => {
    expect(paraCentavos("1.200,00")).toBe(120000);
  });

  it("as duas convenções leem inteiro sem separador igual", () => {
    for (const f of FORMATOS_DE_NUMERO) {
      expect(paraCentavos("15", f)).toBe(1500);
    }
  });

  /*
   * A promessa que o comentário do módulo faz desde a spec 02: a conta é em
   * texto, e `19.90 * 100` daria `1989.9999999999998`.
   */
  it("não perde centavo em ponto flutuante", () => {
    expect(paraCentavos("19,90", "pt-BR")).toBe(1990);
    expect(paraCentavos("19.90", "en-US")).toBe(1990);
  });
});
