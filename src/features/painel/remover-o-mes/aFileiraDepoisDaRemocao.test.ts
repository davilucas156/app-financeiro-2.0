import { describe, expect, it } from "vitest";
import {
  mesesEPadrao,
  type MesContado,
} from "@/features/painel/navegar-entre-meses/mesesEPadrao";
import { oQueSaiDoMes, type LinhaDoEnvioPorMes } from "./oQueSaiDoMes";

/**
 * As duas metades da spec 14 se encontrando (tarefa E1).
 *
 * A fase A arrumou a fileira de meses; a fase B ensinou a contar o que sai
 * junto com um mês. Este teste liga as duas: **o que a remoção leva muda a
 * fileira, e às vezes muda qual mês abre sozinho.**
 *
 * ⚠ **O critério de aceitação da spec não está aqui, e é melhor dizer por quê.**
 * "Remover e reenviar o arquivo corrigido, e o app aceitar" depende de a linha
 * de `imports` ter sumido — e portanto do `unique(user_id, hash)`. É
 * comportamento de banco, e este projeto não tem teste de banco: um com banco
 * fingido provaria que o dublê devolve o que eu mandei ele devolver. Essa
 * conferência é do Davi.
 */

/**
 * O que a `dadosDoPainel` veria depois da remoção, sem ir ao banco: tira do
 * mês a mês tudo que os envios removidos levavam.
 */
function oPainelDepoisDeRemover(
  contados: MesContado[],
  mesRemovido: string,
  linhas: LinhaDoEnvioPorMes[],
) {
  const saida = oQueSaiDoMes(mesRemovido, linhas);

  const perdidoPorMes = new Map(
    saida.transbordo.map((atingido) => [atingido.mes, atingido.lancamentos]),
  );

  const sobraram = contados
    .filter((m) => m.mes !== mesRemovido)
    .map((m) => ({
      mes: m.mes,
      comMovimento: m.comMovimento - (perdidoPorMes.get(m.mes) ?? 0),
    }));

  return { saida, painel: mesesEPadrao(sobraram) };
}

const linha = (
  importId: string,
  mes: string,
  lancamentos: number,
): LinhaDoEnvioPorMes => ({
  importId,
  nomeArquivo: "extrato.csv",
  origem: "csv_conta",
  mes,
  lancamentos,
});

describe("o mês sai, e a fileira continua em pé", () => {
  it("a fileira perde uma aba e continua em ordem de tempo", () => {
    const { painel } = oPainelDepoisDeRemover(
      [
        { mes: "2026-05", comMovimento: 30 },
        { mes: "2026-06", comMovimento: 40 },
        { mes: "2026-07", comMovimento: 20 },
      ],
      "2026-06",
      [linha("a", "2026-06", 40)],
    );

    expect(painel!.meses).toEqual(["2026-05", "2026-07"]);
  });

  it("removendo o mês mais recente, o painel abre no anterior", () => {
    const { painel } = oPainelDepoisDeRemover(
      [
        { mes: "2026-05", comMovimento: 30 },
        { mes: "2026-06", comMovimento: 40 },
      ],
      "2026-06",
      [linha("a", "2026-06", 40)],
    );

    expect(painel!.padrao).toBe("2026-05");
  });

  it("removendo o último mês da conta, não sobra painel", () => {
    const { painel } = oPainelDepoisDeRemover(
      [{ mes: "2026-06", comMovimento: 40 }],
      "2026-06",
      [linha("a", "2026-06", 40)],
    );

    expect(painel).toBeNull();
  });
});

/*
 * ⚠ **O teste que só existe porque as duas fases existem.**
 *
 * O extrato de conta é arquivado pelo mês da data, então o de junho põe
 * lançamentos em julho. Se julho **só** tinha esses, remover junho o esvazia — e
 * um mês vazio continua na fileira (ele existe) mas deixa de ser onde o painel
 * abre, pela regra de campo da spec 04. Duas fases decidindo juntas uma coisa
 * que nenhuma das duas decide sozinha.
 */
describe("o transbordo chega até qual mês abre sozinho", () => {
  const CONTADOS: MesContado[] = [
    { mes: "2026-05", comMovimento: 30 },
    { mes: "2026-06", comMovimento: 40 },
    { mes: "2026-07", comMovimento: 4 },
  ];

  const LINHAS = [linha("a", "2026-06", 40), linha("a", "2026-07", 4)];

  it("o aviso conta o que julho perde", () => {
    const { saida } = oPainelDepoisDeRemover(CONTADOS, "2026-06", LINHAS);

    expect(saida.transbordo).toEqual([{ mes: "2026-07", lancamentos: 4 }]);
  });

  it("julho continua na fileira, esvaziado", () => {
    const { painel } = oPainelDepoisDeRemover(CONTADOS, "2026-06", LINHAS);

    expect(painel!.meses).toEqual(["2026-05", "2026-07"]);
  });

  it("mas quem abre é maio, e não o julho vazio", () => {
    const { painel } = oPainelDepoisDeRemover(CONTADOS, "2026-06", LINHAS);

    expect(painel!.padrao).toBe("2026-05");
  });

  /*
   * O contraste: sem o transbordo, julho continuaria com movimento e seria ele
   * a abrir. É o mesmo mês, a mesma remoção — só muda o que o envio levava.
   */
  it("sem transbordo, julho continua sendo quem abre", () => {
    const { painel } = oPainelDepoisDeRemover(CONTADOS, "2026-06", [
      linha("a", "2026-06", 40),
    ]);

    expect(painel!.padrao).toBe("2026-07");
  });
});
