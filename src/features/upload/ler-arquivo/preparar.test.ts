import { describe, expect, it } from "vitest";
import {
  impressaoDigital,
  normalizarDescricao,
  prepararLancamentos,
  type EntradaDeArquivo,
} from "./preparar";
import type { Lancamento } from "./lancamentos";
import { paraLancamentos } from "./lancamentos";
import { reconhecer, type Reconhecimento } from "./reconhecer";
import { EXTRATO_INTER, FATURA_INTER } from "./amostras";

const bytes = (t: string) => new TextEncoder().encode(t);

function lancamento(p: Partial<Lancamento> = {}): Lancamento {
  return {
    data: "2026-06-02",
    descricao: "ALGUMA COISA",
    valorCentavos: 1200,
    direcao: "saida",
    parcela: null,
    categoriaDoBanco: null,
    linha: 1,
    ...p,
  };
}

function deArquivo(texto: string): EntradaDeArquivo {
  const r = reconhecer(bytes(texto));
  if (!r.ok) throw new Error(r.mensagem);
  const pronto = r as Extract<Reconhecimento, { ok: true }>;
  return {
    origem: pronto.formato.origem,
    lancamentos: paraLancamentos(pronto).lancamentos,
  };
}

describe("normalizarDescricao", () => {
  it("iguala caixa, acento e espaçamento", () => {
    expect(normalizarDescricao("LOJA    Betim   BRA")).toBe("LOJA BETIM BRA");
    expect(normalizarDescricao("Alimentação")).toBe("ALIMENTACAO");
    expect(normalizarDescricao("  Uber  ")).toBe("UBER");
  });

  it("é o que impede o mesmo lançamento de parecer novo no mês seguinte", () => {
    // Basta o banco mudar o alinhamento por espaço para as duas formas
    // aparecerem — a impressão não pode mudar por causa disso.
    expect(normalizarDescricao("LOJA  X")).toBe(normalizarDescricao("Loja X"));
  });
});

describe("impressaoDigital", () => {
  it("tem sempre 64 caracteres, seja qual for a descrição", () => {
    const curta = impressaoDigital("csv_conta", lancamento(), 1);
    const longa = impressaoDigital(
      "csv_conta",
      lancamento({ descricao: "x".repeat(5000) }),
      1,
    );
    expect(curta).toHaveLength(64);
    expect(longa).toHaveLength(64);
  });

  it("é determinística — o mesmo lançamento dá a mesma impressão", () => {
    expect(impressaoDigital("csv_conta", lancamento(), 1)).toBe(
      impressaoDigital("csv_conta", lancamento(), 1),
    );
  });

  it("não depende da linha em que o lançamento estava", () => {
    // Se dependesse, acrescentar uma linha no topo do arquivo faria tudo
    // abaixo parecer novo.
    expect(impressaoDigital("csv_conta", lancamento({ linha: 7 }), 1)).toBe(
      impressaoDigital("csv_conta", lancamento({ linha: 99 }), 1),
    );
  });

  it("muda com data, valor, direção, descrição, origem e ocorrência", () => {
    const base = impressaoDigital("csv_conta", lancamento(), 1);

    expect(impressaoDigital("csv_conta", lancamento({ data: "2026-06-03" }), 1)).not.toBe(base);
    expect(impressaoDigital("csv_conta", lancamento({ valorCentavos: 1201 }), 1)).not.toBe(base);
    expect(impressaoDigital("csv_conta", lancamento({ direcao: "entrada" }), 1)).not.toBe(base);
    expect(impressaoDigital("csv_conta", lancamento({ descricao: "OUTRA" }), 1)).not.toBe(base);
    expect(impressaoDigital("csv_cartao", lancamento(), 1)).not.toBe(base);
    expect(impressaoDigital("csv_conta", lancamento(), 2)).not.toBe(base);
  });

  it("ignora diferença só de espaçamento e caixa", () => {
    expect(impressaoDigital("csv_conta", lancamento({ descricao: "LOJA  X" }), 1)).toBe(
      impressaoDigital("csv_conta", lancamento({ descricao: "Loja X" }), 1),
    );
  });
});

describe("ocorrência — o que salva a pendência 2", () => {
  const doisCafes: EntradaDeArquivo = {
    origem: "csv_conta",
    lancamentos: [
      lancamento({ descricao: "CAFE", valorCentavos: 1200, linha: 2 }),
      lancamento({ descricao: "CAFE", valorCentavos: 1200, linha: 3 }),
    ],
  };

  it("dois lançamentos idênticos no mesmo dia recebem impressões diferentes", () => {
    const [a, b] = prepararLancamentos([doisCafes]);
    expect(a.impressao).not.toBe(b.impressao);
  });

  it("sem isso o banco engoliria o segundo café, e ele é real", () => {
    const [a, b] = prepararLancamentos([doisCafes]);
    expect(new Set([a.impressao, b.impressao]).size).toBe(2);
  });

  it("reenviar o mesmo arquivo gera exatamente as mesmas impressões", () => {
    const primeira = prepararLancamentos([doisCafes]).map((l) => l.impressao);
    const segunda = prepararLancamentos([doisCafes]).map((l) => l.impressao);
    expect(segunda).toEqual(primeira);
  });

  it("um arquivo com só um dos dois colide com a primeira ocorrência", () => {
    const [a] = prepararLancamentos([doisCafes]);
    const [so] = prepararLancamentos([
      { origem: "csv_conta", lancamentos: [doisCafes.lancamentos[0]] },
    ]);
    expect(so.impressao).toBe(a.impressao);
  });

  it("três iguais viram três impressões", () => {
    const tres = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [lancamento(), lancamento(), lancamento()],
      },
    ]);
    expect(new Set(tres.map((l) => l.impressao)).size).toBe(3);
  });
});

describe("pagamento de fatura", () => {
  it("é detectado no extrato da conta", () => {
    const preparados = prepararLancamentos([deArquivo(EXTRATO_INTER)]);
    const pagamento = preparados.find((l) => l.descricao.includes("Pagamento fatura"));

    expect(pagamento?.marcacao).toBe("excluido");
    expect(pagamento?.motivo).toContain("pagamento da fatura");
  });

  it("é detectado na fatura do cartão", () => {
    const preparados = prepararLancamentos([deArquivo(FATURA_INTER)]);
    const pagamento = preparados.find((l) => l.descricao === "PAGAMENTO ON LINE");

    expect(pagamento?.marcacao).toBe("excluido");
  });

  it("os dois lados do mesmo pagamento são marcados quando os arquivos vêm juntos", () => {
    // Sem isto, os R$ 318,19 sairiam duas vezes da conta.
    const preparados = prepararLancamentos([
      deArquivo(EXTRATO_INTER),
      deArquivo(FATURA_INTER),
    ]);
    const excluidos = preparados.filter((l) => l.marcacao === "excluido");

    expect(excluidos).toHaveLength(2);
    expect(excluidos.every((l) => l.valorCentavos === 31819)).toBe(true);
    expect(new Set(excluidos.map((l) => l.origem)).size).toBe(2);
  });

  it("um lançamento comum não é marcado", () => {
    const preparados = prepararLancamentos([deArquivo(EXTRATO_INTER)]);
    const comum = preparados.find((l) => l.descricao.includes("Pix enviado"));

    expect(comum?.marcacao).toBe("normal");
    expect(comum?.motivo).toBeNull();
  });
});

describe("par que se anula", () => {
  const par = (dias: string[]) =>
    prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({ data: dias[0], direcao: "saida", valorCentavos: 43529, linha: 2 }),
          lancamento({ data: dias[1], direcao: "entrada", valorCentavos: 43529, descricao: "VOLTOU", linha: 3 }),
        ],
      },
    ]);

  it("mesmo valor, direções opostas, mesmo dia", () => {
    const [a, b] = par(["2026-06-09", "2026-06-09"]);
    expect(a.marcacao).toBe("revisao");
    expect(b.marcacao).toBe("revisao");
  });

  it("cada lado aponta para o outro", () => {
    const [a, b] = par(["2026-06-09", "2026-06-09"]);
    expect(a.parDe).toBe(b.impressao);
    expect(b.parDe).toBe(a.impressao);
  });

  it("nada é apagado — os dois continuam na lista", () => {
    expect(par(["2026-06-09", "2026-06-09"])).toHaveLength(2);
  });

  it("dentro da janela de 3 dias", () => {
    expect(par(["2026-06-09", "2026-06-12"])[0].marcacao).toBe("revisao");
  });

  it("fora da janela não é par", () => {
    expect(par(["2026-06-09", "2026-06-13"])[0].marcacao).toBe("normal");
  });

  it("mesma direção não é par", () => {
    const iguais = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({ valorCentavos: 5000, direcao: "saida", linha: 2 }),
          lancamento({ valorCentavos: 5000, direcao: "saida", descricao: "OUTRA", linha: 3 }),
        ],
      },
    ]);
    expect(iguais.every((l) => l.marcacao === "normal")).toBe(true);
  });

  it("valor zero não vira par, senão casaria tudo com tudo", () => {
    const zeros = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({ valorCentavos: 0, direcao: "saida", linha: 2 }),
          lancamento({ valorCentavos: 0, direcao: "entrada", descricao: "B", linha: 3 }),
        ],
      },
    ]);
    expect(zeros.every((l) => l.marcacao === "normal")).toBe(true);
  });

  it("cada lançamento entra em um par só", () => {
    // Três valores iguais: dois viram par, o terceiro sobra.
    const tres = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({ valorCentavos: 5000, direcao: "saida", descricao: "A", linha: 2 }),
          lancamento({ valorCentavos: 5000, direcao: "entrada", descricao: "B", linha: 3 }),
          lancamento({ valorCentavos: 5000, direcao: "entrada", descricao: "C", linha: 4 }),
        ],
      },
    ]);
    expect(tres.filter((l) => l.marcacao === "revisao")).toHaveLength(2);
    expect(tres.filter((l) => l.marcacao === "normal")).toHaveLength(1);
  });

  it("vence o candidato de data mais próxima", () => {
    const lista = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lancamento({ data: "2026-06-09", direcao: "saida", valorCentavos: 5000, descricao: "A", linha: 2 }),
          lancamento({ data: "2026-06-12", direcao: "entrada", valorCentavos: 5000, descricao: "LONGE", linha: 3 }),
          lancamento({ data: "2026-06-09", direcao: "entrada", valorCentavos: 5000, descricao: "PERTO", linha: 4 }),
        ],
      },
    ]);
    const a = lista.find((l) => l.descricao === "A");
    const perto = lista.find((l) => l.descricao === "PERTO");
    expect(a?.parDe).toBe(perto?.impressao);
    expect(lista.find((l) => l.descricao === "LONGE")?.marcacao).toBe("normal");
  });

  it("pagamento de fatura já excluído não vira também revisão", () => {
    const preparados = prepararLancamentos([
      deArquivo(EXTRATO_INTER),
      deArquivo(FATURA_INTER),
    ]);
    const excluidos = preparados.filter((l) => l.marcacao === "excluido");
    expect(excluidos.every((l) => l.parDe === null)).toBe(true);
  });
});

describe("bordas", () => {
  it("lista vazia devolve vazio", () => {
    expect(prepararLancamentos([])).toEqual([]);
  });

  it("arquivo sem lançamentos devolve vazio", () => {
    expect(prepararLancamentos([{ origem: "csv_conta", lancamentos: [] }])).toEqual([]);
  });

  it("preserva tudo que a A3 produziu", () => {
    const [l] = prepararLancamentos([deArquivo(FATURA_INTER)]);
    expect(l).toMatchObject({
      data: "2026-06-27",
      valorCentavos: 1500,
      direcao: "saida",
      categoriaDoBanco: "TRANSPORTE",
      origem: "csv_cartao",
    });
  });
});
