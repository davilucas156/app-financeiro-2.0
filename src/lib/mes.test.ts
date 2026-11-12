import { describe, expect, it } from "vitest";
import {
  abreviacaoDoMes,
  formatoDeMesValido,
  mesAtual,
  mesDeData,
  rotuloCurtoDeMes,
} from "./mes";

/**
 * O primeiro teste deste arquivo, e ele existe por uma razão só (spec 13, C3).
 *
 * `rotuloDeMes`, `nomeDoMes` e `anoDoMes` são traduções de texto para texto —
 * erram visivelmente. `mesAtual` lê um relógio, e ler o fuso errado produz o
 * mês certo em quase todo dia do ano: o erro só aparece na virada, uma vez por
 * mês, para quem estiver do lado errado do meridiano.
 */
describe("o mês de hoje é lido em UTC", () => {
  it("formata com dois dígitos", () => {
    expect(mesAtual(new Date("2026-03-04T12:00:00Z"))).toBe("2026-03");
    expect(mesAtual(new Date("2026-11-30T12:00:00Z"))).toBe("2026-11");
  });

  /*
   * ⚠ **A virada.** 1º de janeiro às 00:30 UTC ainda é 31 de dezembro no
   * horário de Brasília. Lendo o fuso do aparelho, o app diria "2025-12" — e a
   * meta de janeiro seria calculada sobre a renda de dezembro.
   */
  it("não recua na virada do ano", () => {
    expect(mesAtual(new Date("2027-01-01T00:30:00Z"))).toBe("2027-01");
  });

  it("não avança no fim do mês", () => {
    expect(mesAtual(new Date("2026-06-30T23:30:00Z"))).toBe("2026-06");
  });
});

/**
 * O rótulo curto erra visivelmente — mas erra num lugar onde ninguém olha de
 * perto, porque é o texto de uma aba. "Mar" e "Mai" diferem por uma letra, e
 * é esse o teste que importa.
 */
describe("rótulo curto da aba", () => {
  it("corta o nome em três letras e o ano em dois dígitos", () => {
    expect(rotuloCurtoDeMes("2026-06")).toBe("Jun 26");
    expect(rotuloCurtoDeMes("2025-11")).toBe("Nov 25");
  });

  it("distingue os meses que começam igual", () => {
    expect(rotuloCurtoDeMes("2026-03")).toBe("Mar 26");
    expect(rotuloCurtoDeMes("2026-05")).toBe("Mai 26");
    expect(rotuloCurtoDeMes("2026-01")).toBe("Jan 26");
    expect(rotuloCurtoDeMes("2026-07")).toBe("Jul 26");
    expect(rotuloCurtoDeMes("2026-06")).toBe("Jun 26");
  });

  /* "Março" tem cedilha na quarta letra, não nas três primeiras. */
  it("não deixa acento no corte", () => {
    expect(rotuloCurtoDeMes("2026-03")).not.toContain("ç");
  });

  /* Mês inválido devolve o que recebeu: a aba mostra o defeito, não some. */
  it("devolve a entrada quando o mês não existe", () => {
    expect(rotuloCurtoDeMes("2026-13")).toBe("2026-13");
  });
});

/**
 * A régua de `formatoDeMesValido` é mais estrita que o `check` do banco de
 * propósito: o banco aceita `"2026-13"`, a aplicação não.
 */
describe("formato do mês", () => {
  it("aceita os doze meses do ano", () => {
    expect(formatoDeMesValido("2026-01")).toBe(true);
    expect(formatoDeMesValido("2026-12")).toBe(true);
  });

  it("recusa mês fora de 01–12", () => {
    expect(formatoDeMesValido("2026-13")).toBe(false);
    expect(formatoDeMesValido("2026-00")).toBe(false);
    expect(formatoDeMesValido("0000-99")).toBe(false);
  });

  it("recusa qualquer outra forma", () => {
    expect(formatoDeMesValido("2026-1")).toBe(false);
    expect(formatoDeMesValido("26-01")).toBe(false);
    expect(formatoDeMesValido("2026-01-01")).toBe(false);
  });
});

describe("mesDeData", () => {
  it("formata com dois dígitos e lê em UTC", () => {
    expect(mesDeData(new Date("2026-03-04T12:00:00Z"))).toBe("2026-03");
  });

  /* 31 de dezembro às 22h UTC já é 1º de janeiro em Brasília, e o mês é o de UTC. */
  it("vira o ano em UTC", () => {
    expect(mesDeData(new Date("2026-12-31T23:59:59Z"))).toBe("2026-12");
    expect(mesDeData(new Date("2027-01-01T00:00:00Z"))).toBe("2027-01");
  });
});

describe("abreviação do mês", () => {
  it("corta o nome em três letras", () => {
    expect(abreviacaoDoMes("2026-06")).toBe("jun");
    expect(abreviacaoDoMes("2026-01")).toBe("jan");
  });

  it("não deixa acento no corte de março", () => {
    expect(abreviacaoDoMes("2026-03")).toBe("mar");
  });

  it("devolve o texto cortado quando o mês não existe", () => {
    expect(abreviacaoDoMes("2026-13")).toBe("202");
  });
});
