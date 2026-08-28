import { describe, expect, it } from "vitest";
import {
  paraCentavos,
  paraDataISO,
  paraLancamentos,
  paraParcela,
} from "./lancamentos";
import { reconhecer, type Reconhecimento } from "./reconhecer";
import { EXTRATO_INTER, FATURA_INTER } from "./amostras";

const bytes = (t: string) => new TextEncoder().encode(t);

function ler(texto: string) {
  const r = reconhecer(bytes(texto));
  if (!r.ok) throw new Error(`não reconheceu: ${r.mensagem}`);
  return paraLancamentos(r as Extract<Reconhecimento, { ok: true }>);
}

describe("paraCentavos", () => {
  it("lê os formatos medidos nos arquivos reais", () => {
    expect(paraCentavos("1.200,00")).toBe(120000);
    expect(paraCentavos("-60,00")).toBe(-6000);
    expect(paraCentavos("R$ 15,00")).toBe(1500);
    expect(paraCentavos("-R$ 318,19")).toBe(-31819);
    expect(paraCentavos("2.581,55")).toBe(258155);
  });

  it("aceita o sinal depois do símbolo de moeda", () => {
    expect(paraCentavos("R$ -318,19")).toBe(-31819);
  });

  it("aceita sinal de mais", () => {
    expect(paraCentavos("+15,00")).toBe(1500);
  });

  it("não perde centavo por ponto flutuante", () => {
    // 19.90 * 100 === 1989.9999999999998 em JavaScript.
    expect(paraCentavos("19,90")).toBe(1990);
    expect(paraCentavos("0,29")).toBe(29);
    expect(paraCentavos("1.234.567,89")).toBe(123456789);
  });

  it("uma casa decimal é décimo, não centésimo", () => {
    expect(paraCentavos("1,5")).toBe(150);
  });

  it("sem vírgula é valor inteiro em reais", () => {
    expect(paraCentavos("1200")).toBe(120000);
  });

  it("ponto é milhar, nunca decimal", () => {
    // A regra pt-BR: 1.200 é mil e duzentos. Ler como 1,20 erraria por cem.
    expect(paraCentavos("1.200")).toBe(120000);
  });

  it("aceita zero", () => {
    expect(paraCentavos("0,00")).toBe(0);
  });

  it("remove espaço não separável e espaço fino", () => {
    expect(paraCentavos("R$ 15,00")).toBe(1500);
    expect(paraCentavos("R$ 15,00")).toBe(1500);
  });

  it("recusa o que não dá para ler", () => {
    expect(paraCentavos("")).toBeNull();
    expect(paraCentavos("   ")).toBeNull();
    expect(paraCentavos("abc")).toBeNull();
    expect(paraCentavos("12,345")).toBeNull(); // 3 casas
    expect(paraCentavos("1,2,3")).toBeNull();
    expect(paraCentavos("R$")).toBeNull();
  });
});

describe("paraDataISO", () => {
  it("converte dd/mm/aaaa", () => {
    expect(paraDataISO("02/06/2026")).toBe("2026-06-02");
    expect(paraDataISO("19/03/2026")).toBe("2026-03-19");
  });

  it("apara espaço", () => {
    expect(paraDataISO(" 02/06/2026 ")).toBe("2026-06-02");
  });

  it("recusa data que não existe, não só faixa inválida", () => {
    expect(paraDataISO("31/02/2026")).toBeNull();
    expect(paraDataISO("29/02/2026")).toBeNull(); // 2026 não é bissexto
    expect(paraDataISO("31/04/2026")).toBeNull();
  });

  it("aceita 29/02 em ano bissexto", () => {
    expect(paraDataISO("29/02/2024")).toBe("2024-02-29");
  });

  it("recusa faixa impossível", () => {
    expect(paraDataISO("00/06/2026")).toBeNull();
    expect(paraDataISO("32/06/2026")).toBeNull();
    expect(paraDataISO("02/13/2026")).toBeNull();
  });

  it("recusa outros formatos, inclusive ISO e ano de 2 dígitos", () => {
    expect(paraDataISO("2026-06-02")).toBeNull();
    expect(paraDataISO("02/06/26")).toBeNull();
    expect(paraDataISO("2/6/2026")).toBeNull();
    expect(paraDataISO("")).toBeNull();
  });
});

describe("paraParcela", () => {
  it("extrai o parcelamento", () => {
    expect(paraParcela("Parcela 1/2")).toBe("1/2");
    expect(paraParcela("Parcela 4/12")).toBe("4/12");
    expect(paraParcela("Parcela 2/6")).toBe("2/6");
  });

  it("compra à vista não tem parcela", () => {
    expect(paraParcela("Compra à vista")).toBeNull();
    expect(paraParcela(null)).toBeNull();
    expect(paraParcela("")).toBeNull();
  });
});

describe("direção — o mesmo sinal significa o oposto nos dois arquivos", () => {
  it("no extrato, negativo é saída", () => {
    const { lancamentos } = ler(EXTRATO_INTER);
    const saida = lancamentos.find((l) => l.descricao.includes("Pix enviado"));
    const entrada = lancamentos.find((l) =>
      l.descricao.includes("Pix recebido"),
    );

    expect(saida?.direcao).toBe("saida");
    expect(entrada?.direcao).toBe("entrada");
  });

  it("na fatura, uma compra positiva é saída", () => {
    const { lancamentos } = ler(FATURA_INTER);
    const compra = lancamentos.find((l) => l.descricao.includes("LOJA"));

    expect(compra?.direcao).toBe("saida");
    expect(compra?.valorCentavos).toBe(1500);
  });

  it("na fatura, o negativo é o pagamento que abate — entrada", () => {
    const { lancamentos } = ler(FATURA_INTER);
    const pagamento = lancamentos.find(
      (l) => l.descricao === "PAGAMENTO ON LINE",
    );

    expect(pagamento?.direcao).toBe("entrada");
    expect(pagamento?.valorCentavos).toBe(31819);
  });

  it("assumir 'negativo é saída' nos dois inverteria o cartão inteiro", () => {
    // Guarda contra a regressão mais cara possível: todo gasto do cartão
    // virando receita e o mês fechando com renda inventada.
    const { lancamentos } = ler(FATURA_INTER);
    const gastos = lancamentos.filter((l) => l.direcao === "saida");

    expect(gastos).toHaveLength(2);
    expect(lancamentos.filter((l) => l.direcao === "entrada")).toHaveLength(1);
  });
});

describe("valor é sempre positivo; o sentido fica em direcao", () => {
  it("nenhum lançamento tem valor negativo", () => {
    const todos = [
      ...ler(EXTRATO_INTER).lancamentos,
      ...ler(FATURA_INTER).lancamentos,
    ];
    expect(todos.every((l) => l.valorCentavos >= 0)).toBe(true);
  });
});

describe("extras do cartão", () => {
  it("guarda parcela e a categoria do banco", () => {
    const { lancamentos } = ler(FATURA_INTER);
    const parcelado = lancamentos.find((l) => l.descricao.includes("OFICINA"));

    expect(parcelado?.parcela).toBe("1/2");
    expect(parcelado?.categoriaDoBanco).toBe("OUTROS");
  });

  it("no extrato não há parcela nem categoria do banco", () => {
    const { lancamentos } = ler(EXTRATO_INTER);
    expect(lancamentos.every((l) => l.parcela === null)).toBe(true);
    expect(lancamentos.every((l) => l.categoriaDoBanco === null)).toBe(true);
  });
});

describe("descrição", () => {
  it("apara as pontas mas preserva o alinhamento do meio", () => {
    const { lancamentos } = ler(FATURA_INTER);
    const loja = lancamentos.find((l) => l.descricao.startsWith("LOJA"));

    expect(loja?.descricao).toContain("   ");
    expect(loja?.descricao.endsWith(" ")).toBe(false);
  });

  it("preserva as aspas internas do extrato", () => {
    const { lancamentos } = ler(EXTRATO_INTER);
    expect(lancamentos[0].descricao).toContain('"Cp :');
  });
});

describe("linha ruim não derruba o arquivo", () => {
  const cabecalho = "Data Lançamento;Descrição;Valor";

  it("linha toda vazia some em silêncio", () => {
    const { lancamentos, ignoradas } = ler(
      `${cabecalho}\n02/06/2026;algo;10,00\n\n`,
    );
    expect(lancamentos).toHaveLength(1);
    expect(ignoradas).toHaveLength(0);
  });

  it("data inválida é contada, com motivo e conteúdo", () => {
    const { lancamentos, ignoradas } = ler(
      `${cabecalho}\n31/02/2026;algo;10,00\n02/06/2026;outro;20,00`,
    );

    expect(lancamentos).toHaveLength(1);
    expect(ignoradas).toHaveLength(1);
    expect(ignoradas[0].motivo).toContain("data não reconhecida");
    expect(ignoradas[0].conteudo).toContain("31/02/2026");
  });

  it("valor ilegível é contado", () => {
    const { ignoradas } = ler(`${cabecalho}\n02/06/2026;algo;abc`);
    expect(ignoradas[0].motivo).toContain("valor não reconhecido");
  });

  it("descrição vazia é contada", () => {
    const { ignoradas } = ler(`${cabecalho}\n02/06/2026;   ;10,00`);
    expect(ignoradas[0].motivo).toBe("descrição vazia");
  });

  it("linha curta é contada", () => {
    const { ignoradas } = ler(`${cabecalho}\n02/06/2026;algo`);
    expect(ignoradas[0].motivo).toContain("menos colunas");
  });

  it("o número da linha aponta para o arquivo, contando o cabeçalho", () => {
    // Cabeçalho na linha 1; primeiro dado na 2; a ruim é a 3.
    const { ignoradas } = ler(
      `${cabecalho}\n02/06/2026;bom;10,00\n99/99/2026;ruim;10,00`,
    );
    expect(ignoradas[0].linha).toBe(3);
  });

  it("no extrato real o cabeçalho está na linha 6, e os números batem", () => {
    const { lancamentos } = ler(EXTRATO_INTER);
    expect(lancamentos[0].linha).toBe(7);
  });

  it("arquivo só com cabeçalho não é erro, só não tem lançamento", () => {
    const { lancamentos, ignoradas } = ler(cabecalho);
    expect(lancamentos).toHaveLength(0);
    expect(ignoradas).toHaveLength(0);
  });
});

describe("as amostras inteiras", () => {
  it("extrato: 3 lançamentos, nenhum ignorado", () => {
    const { lancamentos, ignoradas } = ler(EXTRATO_INTER);
    expect(lancamentos).toHaveLength(3);
    expect(ignoradas).toHaveLength(0);
    expect(lancamentos[0]).toMatchObject({
      data: "2026-06-02",
      valorCentavos: 120000,
      direcao: "entrada",
    });
  });

  it("fatura: 3 lançamentos, nenhum ignorado", () => {
    const { lancamentos, ignoradas } = ler(FATURA_INTER);
    expect(lancamentos).toHaveLength(3);
    expect(ignoradas).toHaveLength(0);
    expect(lancamentos[0]).toMatchObject({
      data: "2026-06-27",
      valorCentavos: 1500,
      direcao: "saida",
      categoriaDoBanco: "TRANSPORTE",
    });
  });
});
