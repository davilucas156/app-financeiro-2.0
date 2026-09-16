import { describe, expect, it } from "vitest";
import type { Regra } from "@/features/classificacao/motor/regras";
import { prepararRevisao, type LancamentoPendente } from "./pendentes";

/** ⚠ Nenhum nome real: as formas medidas, com comerciantes inventados. */

let n = 0;

const pendente = (p: Partial<LancamentoPendente> = {}): LancamentoPendente => ({
  id: `t${++n}`,
  descricao: "PADARIA CEU AZUL       BETIM         BRA",
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

const contexto = { historico: [], idPorChave: new Map<string, string>() };

describe("o trecho que viraria regra", () => {
  it("no cartão é o trecho estável da A2", () => {
    const [r] = prepararRevisao([pendente()], contexto);
    expect(r.trecho).toBe("PADARIA CEU AZUL BETIM");
  });

  it("num Pix é a contraparte, não o texto", () => {
    // A regra certa ali é do tipo `pessoa`: uma regra amarrada ao número da
    // conta falharia na segunda vez, porque a mesma pessoa apareceu no mesmo
    // mês com dois números diferentes (A3).
    const [r] = prepararRevisao(
      [
        pendente({
          descricao: 'Pix enviado: "Cp :00000000-Fulana de Tal"',
          origem: "csv_conta",
        }),
      ],
      contexto,
    );

    expect(r.pessoa).toBe("Fulana de Tal");
    expect(r.trecho).toBe("Fulana de Tal");
  });

  it("descrição sem trecho estável não oferece regra nenhuma", () => {
    const [r] = prepararRevisao(
      [pendente({ descricao: "0000 0000 000", origem: "csv_conta" })],
      contexto,
    );

    expect(r.trecho).toBeNull();
    expect(r.pegaJunto).toBe(0);
  });
});

describe("quantos outros a regra pegaria junto", () => {
  it("conta os irmãos, sem contar ele mesmo", () => {
    // É o número que a B3 mostra antes de você confirmar — a única defesa
    // contra um trecho curto demais, porque esse erro é silencioso.
    const r = prepararRevisao(
      [
        pendente({ descricao: "PADARIA CEU AZUL     BETIM     BRA" }),
        pendente({ descricao: "PADARIA CEU AZUL   BETIM   BRA" }),
        pendente({ descricao: "PADARIA CEU AZUL      BETIM      BRA" }),
        pendente({ descricao: "OUTRA LOJA           BETIM         BRA" }),
      ],
      contexto,
    );

    expect(r[0].pegaJunto).toBe(2);
    expect(r[3].pegaJunto).toBe(0);
  });

  it("a mesma contraparte com grafia diferente conta", () => {
    const r = prepararRevisao(
      [
        pendente({
          descricao: 'Pix enviado: "Cp :111-FULANA DE TAL"',
          origem: "csv_conta",
        }),
        pendente({
          descricao: 'Pix enviado: "Cp :999-Fulana de Tal"',
          origem: "csv_conta",
        }),
      ],
      contexto,
    );

    expect(r[0].pegaJunto).toBe(1);
  });

  it("não conta quem já tem categoria: a regra nova não o pegaria", () => {
    const r = prepararRevisao(
      [
        pendente({ descricao: "PADARIA CEU AZUL   BETIM   BRA" }),
        pendente({
          descricao: "PADARIA CEU AZUL     BETIM     BRA",
          categoriaId: "cat-ja-tem",
        }),
      ],
      contexto,
    );

    expect(r[0].pegaJunto).toBe(0);
  });
});

describe("lançamento que uma regra já classificou", () => {
  it("não recebe sugestão nenhuma", () => {
    // A pergunta ali é de confirmação, não de escolha. Oferecer sugestões
    // convidaria a trocar por um palpite pior do que a regra que bateu.
    const [r] = prepararRevisao(
      [
        pendente({
          categoriaId: "cat-alimentacao",
          regraChave: "descricao_contem:PADARIA",
          categoriaDoBanco: "RESTAURANTES",
          motivo: "valor alto — confira se a categoria está certa",
        }),
      ],
      {
        historico: [],
        idPorChave: new Map([
          ["conforto-lazer/alimentacao-fora", "cat-alimentacao"],
        ]),
      },
    );

    expect(r.sugestoes).toEqual([]);
    expect(r.categoriaId).toBe("cat-alimentacao");
    expect(r.regraChave).toBe("descricao_contem:PADARIA");
  });
});

describe("sugestões", () => {
  it("chegam da A4, com a procedência", () => {
    const [r] = prepararRevisao(
      [pendente({ categoriaDoBanco: "RESTAURANTES" })],
      {
        historico: [],
        idPorChave: new Map([
          ["conforto-lazer/alimentacao-fora", "cat-alimentacao"],
        ]),
      },
    );

    expect(r.sugestoes[0]).toMatchObject({
      categoriaId: "cat-alimentacao",
      fonte: "categoria-do-banco",
    });
  });

  it("sem histórico e sem palpite do banco, a lista vem vazia", () => {
    // É o caso de 15 em 17 no primeiro mês (A6): a lista completa é o caminho.
    const [r] = prepararRevisao([pendente()], contexto);
    expect(r.sugestoes).toEqual([]);
  });
});

/**
 * O ingrediente do conflito que faz a tela oferecer a regra por valor.
 *
 * ⚠ Aqui sai só o **fato** — qual regra já pega o lançamento. O conflito é "e
 * ela manda para outro lugar", e o outro lugar é a categoria que você acabou
 * de tocar, que ainda não existia quando esta função rodou.
 */
describe("a regra que já pega o lançamento", () => {
  const PIX = 'Pix enviado: "Cp :00000000-Fulana de Tal"';

  const paraFulana = (p: Partial<LancamentoPendente> = {}) =>
    pendente({ descricao: PIX, origem: "csv_conta", ...p });

  const regraDaFulana: Regra = {
    id: "r1",
    criterio: { tipo: "pessoa", nome: "Fulana de Tal" },
    categoriaId: "aluguel",
    prioridade: 10,
  };

  it("sem regras, não há nada a comparar", () => {
    const [r] = prepararRevisao([paraFulana()], contexto);
    expect(r.jaPega).toBeNull();
  });

  it("devolve a regra e para onde ela manda", () => {
    const [r] = prepararRevisao([paraFulana()], {
      ...contexto,
      regras: [regraDaFulana],
    });

    expect(r.jaPega).toEqual({
      texto: "Fulana de Tal",
      categoriaId: "aluguel",
    });
  });

  it("regra que não pega este lançamento não aparece", () => {
    const [r] = prepararRevisao([pendente()], {
      ...contexto,
      regras: [regraDaFulana],
    });

    expect(r.jaPega).toBeNull();
  });

  it("com exceção e padrão, quem aparece é a que de fato vence", () => {
    const excecao: Regra = {
      id: "r2",
      criterio: {
        tipo: "pessoa",
        nome: "Fulana de Tal",
        minimoCentavos: 30000,
        maximoCentavos: 30000,
      },
      categoriaId: "emprestimo",
      prioridade: 10,
    };

    const [naFaixa] = prepararRevisao([paraFulana({ valorCentavos: 30000 })], {
      ...contexto,
      regras: [regraDaFulana, excecao],
    });
    const [foraDaFaixa] = prepararRevisao(
      [paraFulana({ valorCentavos: 70000 })],
      { ...contexto, regras: [regraDaFulana, excecao] },
    );

    expect(naFaixa.jaPega?.categoriaId).toBe("emprestimo");
    expect(foraDaFaixa.jaPega?.categoriaId).toBe("aluguel");
  });
});

describe("quantos a regra pegaria junto, com e sem o valor", () => {
  /*
   * É a comparação lado a lado que faz a escolha do conflito ser decidível:
   * "para qualquer valor pega mais 2, só para R$ 300,00 pega mais 1".
   */
  it("a versão com valor pega menos", () => {
    const PIX = 'Pix enviado: "Cp :00000000-Fulana de Tal"';

    const [primeiro] = prepararRevisao(
      [
        pendente({ descricao: PIX, origem: "csv_conta", valorCentavos: 30000 }),
        pendente({ descricao: PIX, origem: "csv_conta", valorCentavos: 30000 }),
        pendente({ descricao: PIX, origem: "csv_conta", valorCentavos: 70000 }),
      ],
      contexto,
    );

    expect(primeiro.pegaJunto).toBe(2);
    expect(primeiro.pegaJuntoComValor).toBe(1);
  });

  it("sem trecho estável, os dois números são zero", () => {
    const [r] = prepararRevisao(
      [pendente({ descricao: "0000 0000 000", origem: "csv_conta" })],
      contexto,
    );

    expect(r.pegaJunto).toBe(0);
    expect(r.pegaJuntoComValor).toBe(0);
  });
});
