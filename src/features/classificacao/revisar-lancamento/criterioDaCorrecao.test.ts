import { describe, expect, it } from "vitest";
import {
  chaveDoCriterio,
  criterioDaCorrecao,
  textoDoCriterio,
} from "./criterioDaCorrecao";
import { prepararRevisao, type LancamentoPendente } from "./pendentes";

/** ⚠ Nenhum nome real: as formas medidas, com comerciantes inventados. */

const pendente = (p: Partial<LancamentoPendente>): LancamentoPendente => ({
  id: "t1",
  descricao: "",
  valorCentavos: 1500,
  direcao: "saida",
  data: "2026-06-18",
  origem: "csv_cartao",
  parcela: null,
  categoriaDoBanco: null,
  motivo: null,
  categoriaId: null,
  regraChave: null,
  ...p,
});

describe("criterioDaCorrecao", () => {
  it("no cartão vira `descricao_contem` com o trecho estável", () => {
    expect(
      criterioDaCorrecao("PADARIA CEU AZUL       BETIM         BRA", "csv_cartao"),
    ).toEqual({ tipo: "descricao_contem", termo: "PADARIA CEU AZUL BETIM" });
  });

  it("num Pix vira `pessoa`, e não texto", () => {
    // Uma regra amarrada ao número da conta falharia na segunda vez: a mesma
    // contraparte apareceu no mesmo mês com dois números diferentes (A3).
    expect(
      criterioDaCorrecao('Pix enviado: "Cp :00000000-Fulana de Tal"', "csv_conta"),
    ).toEqual({ tipo: "pessoa", nome: "Fulana de Tal" });
  });

  it("sem nada estável, nenhuma regra nasce", () => {
    expect(criterioDaCorrecao("0000 0000 000", "csv_conta")).toBeNull();
  });
});

describe("a chave é a mesma que a A5 usa no seed", () => {
  it("junta tipo e texto com dois-pontos", () => {
    // É o que impede o seed e a correção de criarem duas regras para a mesma
    // coisa — a unicidade `(user_id, chave)` da C1.
    expect(
      chaveDoCriterio({ tipo: "descricao_contem", termo: "PETROBRAS" }),
    ).toBe("descricao_contem:PETROBRAS");

    expect(chaveDoCriterio({ tipo: "pessoa", nome: "Fulana de Tal" })).toBe(
      "pessoa:Fulana de Tal",
    );
  });
});

describe("o que a tela mostra é o que o banco guarda", () => {
  // ⚠ Este teste é a razão de `criterioDaCorrecao` existir num arquivo só.
  //
  // A tela mostra "a regra vai procurar por X" antes de você confirmar, e o
  // serviço grava a regra depois. Se fossem duas implementações, você
  // aprovaria uma regra e receberia outra — o pior erro possível numa pergunta
  // cuja única função é te deixar conferir.
  const casos = [
    "PADARIA CEU AZUL       BETIM         BRA",
    "EBN          SERVICO    CURITIBA      BRA",
    "ALGO NOVO              SAO PAULO     BRA",
  ];

  for (const descricao of casos) {
    it(`${descricao.slice(0, 20).trim()}`, () => {
      const [naTela] = prepararRevisao(
        [pendente({ descricao })],
        { historico: [], idPorChave: new Map() },
      );

      const criterio = criterioDaCorrecao(descricao, "csv_cartao")!;

      expect(naTela.trecho).toBe(textoDoCriterio(criterio));
      expect(chaveDoCriterio(criterio)).toContain(naTela.trecho!);
    });
  }

  it("num Pix também", () => {
    const descricao = 'Pix enviado: "Cp :00000000-Fulana de Tal"';

    const [naTela] = prepararRevisao(
      [pendente({ descricao, origem: "csv_conta" })],
      { historico: [], idPorChave: new Map() },
    );

    expect(naTela.trecho).toBe(
      textoDoCriterio(criterioDaCorrecao(descricao, "csv_conta")!),
    );
  });
});
