import { describe, expect, it } from "vitest";
import {
  fraseDoTransbordo,
  oQueSaiDoMes,
  type LinhaDoEnvioPorMes,
} from "./oQueSaiDoMes";

/**
 * O que a confirmação promete dizer antes de apagar (tarefa B1).
 *
 * O teste que importa é o do transbordo: ele é a única consequência da remoção
 * que o Davi não consegue prever olhando a tela.
 */

const CONTA = "extrato-junho.csv";
const CARTAO = "fatura-junho.csv";

function linha(
  importId: string,
  mes: string,
  lancamentos: number,
  origem: LinhaDoEnvioPorMes["origem"] = "csv_conta",
): LinhaDoEnvioPorMes {
  return {
    importId,
    nomeArquivo: origem === "csv_conta" ? CONTA : CARTAO,
    origem,
    mes,
    lancamentos,
  };
}

describe("o caso comum: o mês sai inteiro e nada mais", () => {
  it("dois envios só neste mês não produzem transbordo", () => {
    const saida = oQueSaiDoMes("2026-06", [
      linha("a", "2026-06", 40),
      linha("b", "2026-06", 13, "csv_cartao"),
    ]);

    expect(saida.envios).toHaveLength(2);
    expect(saida.noMes).toBe(53);
    expect(saida.total).toBe(53);
    expect(saida.transbordo).toEqual([]);
  });

  it("o extrato da conta vem antes da fatura, como no formulário", () => {
    const saida = oQueSaiDoMes("2026-06", [
      linha("b", "2026-06", 13, "csv_cartao"),
      linha("a", "2026-06", 40),
    ]);

    expect(saida.envios.map((e) => e.rotuloDeOrigem)).toEqual([
      "conta",
      "cartão",
    ]);
  });
});

describe("o transbordo, que é a razão desta função existir", () => {
  /*
   * ⚠ A Descoberta 3 da spec 14: o extrato de conta de 02/06 a 02/07 põe
   * lançamentos em julho, e remover junho os leva junto.
   */
  it("um envio que cruza a virada anuncia o mês vizinho e o número", () => {
    const saida = oQueSaiDoMes("2026-06", [
      linha("a", "2026-06", 40),
      linha("a", "2026-07", 4),
    ]);

    expect(saida.noMes).toBe(40);
    expect(saida.total).toBe(44);
    expect(saida.transbordo).toEqual([{ mes: "2026-07", lancamentos: 4 }]);
  });

  it("um envio pode atingir mais de um mês, e a lista cresce", () => {
    const saida = oQueSaiDoMes("2026-06", [
      linha("a", "2026-05", 2),
      linha("a", "2026-06", 40),
      linha("a", "2026-07", 4),
    ]);

    expect(saida.transbordo).toEqual([
      { mes: "2026-05", lancamentos: 2 },
      { mes: "2026-07", lancamentos: 4 },
    ]);
  });

  /* O transbordo é do conjunto que sai, não de cada envio. */
  it("com dois envios, só o que transborda aparece no aviso", () => {
    const saida = oQueSaiDoMes("2026-06", [
      linha("a", "2026-06", 40),
      linha("a", "2026-07", 4),
      linha("b", "2026-06", 13, "csv_cartao"),
    ]);

    expect(saida.transbordo).toEqual([{ mes: "2026-07", lancamentos: 4 }]);
    expect(saida.noMes).toBe(53);
    expect(saida.total).toBe(57);
  });

  /*
   * ⚠ O número ao lado do envio é o que **ele** leva, de todos os meses — não o
   * que ele tem neste mês. É o envio que some, não a fatia dele.
   */
  it("o número de um envio soma todos os meses dele", () => {
    const saida = oQueSaiDoMes("2026-06", [
      linha("a", "2026-06", 40),
      linha("a", "2026-07", 4),
    ]);

    expect(saida.envios[0].lancamentos).toBe(44);
  });
});

/*
 * A corrida: o mês saiu noutra aba enquanto esta estava aberta. Vazio não é
 * erro aqui — é a fase D que transforma isso em recusa, em vez de confirmar a
 * remoção de nada.
 */
it("mês sem envio nenhum devolve tudo zerado", () => {
  const saida = oQueSaiDoMes("2026-06", []);

  expect(saida).toEqual({ envios: [], noMes: 0, transbordo: [], total: 0 });
});

describe("a frase do transbordo", () => {
  it("fala no singular quando é um só", () => {
    expect(
      fraseDoTransbordo({ mes: "2026-07", lancamentos: 1 }, "2026-06"),
    ).toBe("julho perde 1 lançamento");
  });

  it("fala no plural quando são vários", () => {
    expect(
      fraseDoTransbordo({ mes: "2026-07", lancamentos: 4 }, "2026-06"),
    ).toBe("julho perde 4 lançamentos");
  });

  /*
   * ⚠ O ano só aparece quando ele muda. Sem isso, remover janeiro anunciaria
   * "dezembro perde 3 lançamentos" — e o dezembro do ano passado e o deste ano
   * ficariam com a mesma frase.
   */
  it("traz o ano quando o mês atingido é de outro", () => {
    expect(
      fraseDoTransbordo({ mes: "2025-12", lancamentos: 3 }, "2026-01"),
    ).toBe("dezembro de 2025 perde 3 lançamentos");
  });
});
