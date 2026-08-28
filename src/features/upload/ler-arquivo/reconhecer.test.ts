import { describe, expect, it } from "vitest";
import { reconhecer } from "./reconhecer";
import { normalizarNomeDeColuna } from "./formatos";
import { EXTRATO_INTER, FATURA_INTER } from "./amostras";

const bytes = (texto: string) => new TextEncoder().encode(texto);

describe("normalizarNomeDeColuna", () => {
  it("iguala caixa, acento e espaço sobrando", () => {
    const esperado = normalizarNomeDeColuna("Descrição");
    expect(normalizarNomeDeColuna("DESCRIÇÃO")).toBe(esperado);
    expect(normalizarNomeDeColuna("  descricao  ")).toBe(esperado);
    expect(normalizarNomeDeColuna("Descricao")).toBe(esperado);
  });

  it("junta espaços repetidos", () => {
    expect(normalizarNomeDeColuna("Data   Lançamento")).toBe(
      normalizarNomeDeColuna("Data Lançamento"),
    );
  });
});

describe("reconhecer — extrato de conta", () => {
  const r = reconhecer(bytes(EXTRATO_INTER));

  it("identifica o formato", () => {
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.formato.id).toBe("inter-extrato");
    expect(r.formato.origem).toBe("csv_conta");
  });

  it("acha o cabeçalho depois das 5 linhas de metadados", () => {
    if (!r.ok) throw new Error("nao reconheceu");
    expect(r.linhaCabecalho).toBe(5);
  });

  it("mapeia cada papel para a coluna certa", () => {
    if (!r.ok) throw new Error("nao reconheceu");
    expect(r.coluna).toEqual({ data: 0, descricao: 1, valor: 2, saldo: 3 });
  });

  it("devolve só o que vem depois do cabeçalho", () => {
    if (!r.ok) throw new Error("nao reconheceu");
    const comData = r.linhasDeDados.filter((l) => /^\d{2}\//.test(l[0]));
    expect(comData).toHaveLength(3);
    expect(comData[0][1]).toContain("Pix recebido");
  });
});

describe("reconhecer — fatura do cartão", () => {
  const r = reconhecer(bytes(FATURA_INTER));

  it("identifica o formato mesmo com BOM", () => {
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.formato.id).toBe("inter-fatura");
    expect(r.formato.origem).toBe("csv_cartao");
  });

  it("o cabeçalho é a primeira linha", () => {
    if (!r.ok) throw new Error("nao reconheceu");
    expect(r.linhaCabecalho).toBe(0);
  });

  it("mapeia os papéis, incluindo categoria e tipo", () => {
    if (!r.ok) throw new Error("nao reconheceu");
    expect(r.coluna).toEqual({
      data: 0,
      descricao: 1,
      categoria: 2,
      tipo: 3,
      valor: 4,
    });
  });

  it("não confunde os dois arquivos", () => {
    const extrato = reconhecer(bytes(EXTRATO_INTER));
    if (!extrato.ok || !r.ok) throw new Error("nao reconheceu");
    expect(extrato.formato.id).not.toBe(r.formato.id);
  });
});

describe("reconhecer — o mesmo papel com nomes diferentes", () => {
  it("descricao é 'Descrição' num arquivo e 'Lançamento' no outro", () => {
    const extrato = reconhecer(bytes(EXTRATO_INTER));
    const fatura = reconhecer(bytes(FATURA_INTER));
    if (!extrato.ok || !fatura.ok) throw new Error("nao reconheceu");

    expect(extrato.formato.colunas.descricao).toBe("Descrição");
    expect(fatura.formato.colunas.descricao).toBe("Lançamento");
    // E mesmo assim a A3 vai perguntar por `descricao` nos dois.
    expect(extrato.coluna.descricao).toBeDefined();
    expect(fatura.coluna.descricao).toBeDefined();
  });
});

describe("reconhecer — robustez do cabeçalho", () => {
  it("aceita colunas fora de ordem", () => {
    const r = reconhecer(
      bytes("Valor;Data Lançamento;Descrição\n1,00;02/06/2026;algo"),
    );
    if (!r.ok) throw new Error("nao reconheceu");
    expect(r.coluna).toEqual({ valor: 0, data: 1, descricao: 2 });
  });

  it("aceita caixa e acento diferentes", () => {
    const r = reconhecer(bytes("DATA LANCAMENTO;descricao;VALOR\na;b;c"));
    expect(r.ok).toBe(true);
  });

  it("ignora coluna extra desconhecida", () => {
    const r = reconhecer(
      bytes("Data Lançamento;Descrição;Valor;Coluna Nova\na;b;c;d"),
    );
    if (!r.ok) throw new Error("nao reconheceu");
    expect(r.coluna.valor).toBe(2);
  });

  it("acha o cabeçalho mesmo com lixo antes", () => {
    const r = reconhecer(
      bytes("lixo\n\nmais lixo\n\nData Lançamento;Descrição;Valor\na;b;c"),
    );
    if (!r.ok) throw new Error("nao reconheceu");
    expect(r.linhaCabecalho).toBe(4);
  });

  it("coluna opcional ausente não impede o reconhecimento", () => {
    // Sem `Saldo` — o extrato tem, mas não é obrigatório.
    const r = reconhecer(bytes("Data Lançamento;Descrição;Valor\na;b;c"));
    if (!r.ok) throw new Error("nao reconheceu");
    expect(r.coluna.saldo).toBeUndefined();
  });
});

describe("reconhecer — erros", () => {
  it("arquivo vazio", () => {
    const r = reconhecer(bytes(""));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.motivo).toBe("vazio");
  });

  it("arquivo só com BOM e espaço", () => {
    const r = reconhecer(bytes("﻿   \n\n"));
    if (r.ok) throw new Error("deveria falhar");
    expect(r.motivo).toBe("vazio");
  });

  it("arquivo de outro assunto não vira candidato", () => {
    const r = reconhecer(bytes("nome;idade\nana;30"));
    if (r.ok) throw new Error("deveria falhar");
    expect(r.motivo).toBe("desconhecido");
    expect(r.candidato).toBeUndefined();
    expect(r.mensagem).toContain("Não reconheci");
  });

  it("quase-extrato diz qual coluna faltou", () => {
    const r = reconhecer(bytes("Data Lançamento;Descrição;Saldo\na;b;c"));
    if (r.ok) throw new Error("deveria falhar");
    expect(r.candidato?.id).toBe("inter-extrato");
    expect(r.faltando).toEqual(["Valor"]);
    expect(r.mensagem).toContain("faltou a coluna Valor");
  });

  it("quase-fatura diz quais colunas faltaram, no plural", () => {
    const r = reconhecer(bytes('"Data","Categoria","Tipo"\n"a","b","c"'));
    if (r.ok) throw new Error("deveria falhar");
    expect(r.candidato?.id).toBe("inter-fatura");
    expect(r.faltando).toEqual(["Lançamento", "Valor"]);
    expect(r.mensagem).toContain("faltaram as colunas");
  });

  it("só metadados, sem cabeçalho", () => {
    const r = reconhecer(
      bytes("Extrato Conta Corrente\nConta ;123\nPeríodo ;x\n"),
    );
    expect(r.ok).toBe(false);
  });

  it("cabeçalho depois do limite de busca é ignorado", () => {
    const lixo = Array(35).fill("nada").join("\n");
    const r = reconhecer(
      bytes(`${lixo}\nData Lançamento;Descrição;Valor\na;b;c`),
    );
    expect(r.ok).toBe(false);
  });
});

describe("reconhecer — nome do arquivo é irrelevante", () => {
  it("o conteúdo manda, não a extensão nem o nome", () => {
    // Mesmíssimo conteúdo do extrato; nada aqui diz "extrato".
    const r = reconhecer(bytes(EXTRATO_INTER));
    if (!r.ok) throw new Error("nao reconheceu");
    expect(r.formato.id).toBe("inter-extrato");
  });

  it("sem cabeçalho de dados, nem o conteúdo salva", () => {
    const r = reconhecer(bytes("02/06/2026;Pix recebido;1.200,00;2.581,55"));
    expect(r.ok).toBe(false);
  });
});
