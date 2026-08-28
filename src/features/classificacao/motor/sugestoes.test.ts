import { describe, expect, it } from "vitest";
import {
  sugerir,
  type Classificado,
  type ContextoDeSugestao,
} from "./sugestoes";

/** ⚠ Nenhuma descrição real. Só as formas medidas, com nomes inventados. */

const IDS = {
  alimentacaoFora: "id-alimentacao-fora",
  conteudo: "id-conteudo",
  eventos: "id-eventos",
  gasolina: "id-gasolina",
  onibus: "id-onibus",
  assinaturasFixas: "id-assinaturas-fixas",
  assinaturasLazer: "id-assinaturas-lazer",
};

const idPorChave = new Map<string, string>([
  ["conforto-lazer/alimentacao-fora", IDS.alimentacaoFora],
  ["conhecimento/conteudo-ferramentas", IDS.conteudo],
  ["conforto-lazer/saidas-eventos", IDS.eventos],
  ["transporte/gasolina", IDS.gasolina],
  ["transporte/onibus", IDS.onibus],
  ["custos-fixos/assinaturas", IDS.assinaturasFixas],
  ["conforto-lazer/assinaturas", IDS.assinaturasLazer],
]);

const contexto = (historico: Classificado[] = []): ContextoDeSugestao => ({
  historico,
  idPorChave,
});

const noHistorico = (p: Partial<Classificado>): Classificado => ({
  descricao: "LOJA DO ZE           BETIM         BRA",
  origem: "csv_cartao",
  pessoa: null,
  categoriaId: IDS.gasolina,
  chaveDaCategoria: "transporte/gasolina",
  ...p,
});

describe("fonte 1 · você já classificou assim", () => {
  it("é a mais forte, e vem primeiro", () => {
    const s = sugerir(
      {
        descricao: "LOJA DO ZE           BETIM         BRA",
        origem: "csv_cartao",
      },
      contexto([noHistorico({ categoriaId: IDS.onibus })]),
    );

    expect(s[0]).toMatchObject({
      categoriaId: IDS.onibus,
      fonte: "voce-ja-classificou",
    });
  });

  it("casa pelo trecho, e não pela descrição crua", () => {
    // O espaçamento das colunas muda entre faturas; o trecho, não.
    const s = sugerir(
      { descricao: "LOJA DO ZE      BETIM      BRA", origem: "csv_cartao" },
      contexto([noHistorico({ categoriaId: IDS.onibus })]),
    );

    expect(s[0]?.categoriaId).toBe(IDS.onibus);
  });

  it("a mesma loja em outra cidade **não** casa — e tudo bem", () => {
    // Consequência direta da A2, que mantém a cidade quando ela tem coluna
    // própria. É o erro barulhento de sempre: a sugestão não aparece, você
    // escolhe na lista, e nada foi classificado errado em silêncio.
    const s = sugerir(
      {
        descricao: "LOJA DO ZE           CONTAGEM      BRA",
        origem: "csv_cartao",
      },
      contexto([noHistorico({ categoriaId: IDS.onibus })]),
    );

    expect(s).toEqual([]);
  });

  it("não confunde lojas diferentes", () => {
    const s = sugerir(
      {
        descricao: "OUTRA LOJA           BETIM         BRA",
        origem: "csv_cartao",
      },
      contexto([noHistorico({})]),
    );

    expect(s).toEqual([]);
  });
});

describe("fonte 2 · mesma contraparte", () => {
  it("sugere o que você usou para essa pessoa, mesmo com grafia diferente", () => {
    const s = sugerir(
      {
        descricao: 'Pix enviado: "Cp :123-FULANA DE TAL"',
        origem: "csv_conta",
        pessoa: "FULANA DE TAL",
      },
      contexto([
        noHistorico({
          descricao: 'Pix enviado: "Cp :999-Fulana de Tal"',
          origem: "csv_conta",
          pessoa: "Fulana de Tal",
          categoriaId: IDS.eventos,
          chaveDaCategoria: "conforto-lazer/saidas-eventos",
        }),
      ]),
    );

    expect(s[0]).toMatchObject({
      categoriaId: IDS.eventos,
      fonte: "mesma-contraparte",
    });
    expect(s[0]?.porque).toContain("FULANA DE TAL");
  });

  it("lançamento sem contraparte pula essa fonte", () => {
    const s = sugerir(
      { descricao: "ALGO NOVO", origem: "csv_conta", pessoa: null },
      contexto([
        noHistorico({ pessoa: "Fulana de Tal", categoriaId: IDS.eventos }),
      ]),
    );

    expect(s).toEqual([]);
  });
});

describe("fonte 3 · a categoria do banco", () => {
  it("traduz as específicas", () => {
    const s = sugerir(
      {
        descricao: "PADARIA CEU AZUL     SAO PAULO     BRA",
        origem: "csv_cartao",
        categoriaDoBanco: "RESTAURANTES",
      },
      contexto(),
    );

    expect(s[0]).toMatchObject({
      categoriaId: IDS.alimentacaoFora,
      fonte: "categoria-do-banco",
    });
  });

  it("ignora as genéricas", () => {
    // OUTROS, COMPRAS, SERVICOS e PAGAMENTOS somam 14 dos 32 rótulos medidos.
    // Traduzir "outros" para alguma coisa seria ruído com etiqueta de
    // sugestão — pior que silêncio, porque convida ao toque distraído.
    for (const generica of ["OUTROS", "COMPRAS", "SERVICOS", "PAGAMENTOS"]) {
      const s = sugerir(
        {
          descricao: "ALGO NOVO",
          origem: "csv_cartao",
          categoriaDoBanco: generica,
        },
        contexto(),
      );
      expect(s, generica).toEqual([]);
    }
  });

  it("categoria do banco que eu nunca vi não quebra nada", () => {
    const s = sugerir(
      {
        descricao: "ALGO NOVO",
        origem: "csv_cartao",
        categoriaDoBanco: "COISA NOVA",
      },
      contexto(),
    );

    expect(s).toEqual([]);
  });
});

describe("fonte 4 · o pote do banco, desempatado pelo histórico", () => {
  const alvo = {
    descricao: "ALGO NOVO            BETIM         BRA",
    origem: "csv_cartao" as const,
    categoriaDoBanco: "TRANSPORTE",
  };

  it("sugere a categoria que você mais usa dentro do pote", () => {
    const s = sugerir(
      alvo,
      contexto([
        noHistorico({
          descricao: "A",
          categoriaId: IDS.onibus,
          chaveDaCategoria: "transporte/onibus",
        }),
        noHistorico({
          descricao: "B",
          categoriaId: IDS.onibus,
          chaveDaCategoria: "transporte/onibus",
        }),
        noHistorico({
          descricao: "C",
          categoriaId: IDS.gasolina,
          chaveDaCategoria: "transporte/gasolina",
        }),
      ]),
    );

    expect(s[0]).toMatchObject({
      categoriaId: IDS.onibus,
      fonte: "pote-do-banco",
    });
  });

  it("sem histórico no pote, não inventa qual das quatro categorias é", () => {
    // O banco já chamou de transporte uma compra em loja online. Chutar uma
    // das quatro seria inventar precisão que o rótulo não tem.
    expect(sugerir(alvo, contexto())).toEqual([]);
  });

  it("não vaza histórico de outro pote", () => {
    const s = sugerir(
      alvo,
      contexto([
        noHistorico({
          categoriaId: IDS.alimentacaoFora,
          chaveDaCategoria: "conforto-lazer/alimentacao-fora",
        }),
      ]),
    );

    expect(s).toEqual([]);
  });
});

describe("juntando as fontes", () => {
  it("a mesma categoria por dois caminhos aparece uma vez só, com a fonte mais forte", () => {
    const s = sugerir(
      {
        descricao: "PADARIA CEU AZUL     SAO PAULO     BRA",
        origem: "csv_cartao",
        categoriaDoBanco: "RESTAURANTES",
      },
      contexto([
        noHistorico({
          descricao: "PADARIA CEU AZUL     SAO PAULO     BRA",
          categoriaId: IDS.alimentacaoFora,
          chaveDaCategoria: "conforto-lazer/alimentacao-fora",
        }),
      ]),
    );

    expect(s).toHaveLength(1);
    expect(s[0].fonte).toBe("voce-ja-classificou");
  });

  it("nunca passa de três", () => {
    const s = sugerir(
      {
        descricao: 'Pix enviado: "Cp :123-Fulana de Tal"',
        origem: "csv_conta",
        pessoa: "Fulana de Tal",
        categoriaDoBanco: "RESTAURANTES",
      },
      contexto([
        noHistorico({
          descricao: 'Pix enviado: "Cp :999-Fulana de Tal"',
          origem: "csv_conta",
          pessoa: "Fulana de Tal",
          categoriaId: IDS.eventos,
          chaveDaCategoria: "conforto-lazer/saidas-eventos",
        }),
      ]),
    );

    expect(s.length).toBeLessThanOrEqual(3);
  });

  it("sem nada, devolve lista vazia — e a tela vai direto para a lista completa", () => {
    expect(
      sugerir({ descricao: "ALGO NOVO", origem: "csv_cartao" }, contexto()),
    ).toEqual([]);
  });
});

describe("a chave da categoria é composta", () => {
  it("distingue as duas 'assinaturas' do seed", () => {
    // `assinaturas` existe em Custos Fixos e em Conforto & Lazer. Uma tradução
    // por slug escolheria a errada metade das vezes.
    expect(idPorChave.get("custos-fixos/assinaturas")).not.toBe(
      idPorChave.get("conforto-lazer/assinaturas"),
    );
  });
});
