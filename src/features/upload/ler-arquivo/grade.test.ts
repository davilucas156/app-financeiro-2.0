import { describe, expect, it } from "vitest";
import { decodificar, paraGrade, type Dialeto } from "./grade";
import { EXTRATO_INTER, FATURA_INTER } from "./amostras";

const PONTO_E_VIRGULA: Dialeto = { separador: ";", aspas: false };
const VIRGULA_CITADA: Dialeto = { separador: ",", aspas: true };

const bytes = (texto: string) => new TextEncoder().encode(texto);

describe("decodificar", () => {
  it("remove o BOM, que senão gruda na primeira célula", () => {
    expect(decodificar(bytes("﻿Data,Valor"))).toBe("Data,Valor");
  });

  it("não mexe em arquivo sem BOM", () => {
    expect(decodificar(bytes("Data;Valor"))).toBe("Data;Valor");
  });

  it("lê UTF-8", () => {
    expect(decodificar(bytes("Descrição"))).toBe("Descrição");
  });

  it("cai para Latin-1 quando o arquivo não é UTF-8 válido", () => {
    // "Descrição" em Latin-1: o "ç" é 0xE7 e o "ã" é 0xE3, bytes que sozinhos
    // não formam UTF-8 válido.
    const latin1 = new Uint8Array([
      0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0xe7, 0xe3, 0x6f,
    ]);
    expect(decodificar(latin1)).toBe("Descrição");
  });

  it("não devolve o caractere de substituição quando cai para Latin-1", () => {
    const latin1 = new Uint8Array([0xe7]);
    expect(decodificar(latin1)).not.toContain("�");
  });
});

describe("paraGrade — sem tratamento de aspas (extrato)", () => {
  it("separa por ponto e vírgula", () => {
    expect(paraGrade("a;b;c", PONTO_E_VIRGULA)).toEqual([["a", "b", "c"]]);
  });

  it("trata aspas no meio de campo não citado como texto comum", () => {
    // 21 de 21 linhas do extrato real são assim.
    const linha = 'Pix recebido: "Cp :123-FULANO"';
    expect(paraGrade(`02/06/2026;${linha};1.200,00`, PONTO_E_VIRGULA)).toEqual([
      ["02/06/2026", linha, "1.200,00"],
    ]);
  });

  it("mantém a linha em branco, que a A2 usa para achar o cabeçalho", () => {
    const grade = paraGrade(EXTRATO_INTER, PONTO_E_VIRGULA);
    expect(grade[4]).toEqual([""]);
    expect(grade[5]).toEqual(["Data Lançamento", "Descrição", "Valor", "Saldo"]);
  });

  it("não apara espaço — 'Extrato Conta Corrente' chega inteiro", () => {
    expect(paraGrade(EXTRATO_INTER, PONTO_E_VIRGULA)[0]).toEqual([
      "Extrato Conta Corrente",
    ]);
  });

  it("lê a amostra do extrato com as três linhas de dados", () => {
    const grade = paraGrade(EXTRATO_INTER, PONTO_E_VIRGULA);
    const dados = grade.slice(6).filter((l) => l.length === 4);

    expect(dados).toHaveLength(3);
    expect(dados[0][2]).toBe("1.200,00");
    expect(dados[1][2]).toBe("-318,19");
  });
});

describe("paraGrade — com tratamento de aspas (fatura)", () => {
  it("preserva vírgula dentro de campo citado", () => {
    // Sem isto, TODA linha da fatura quebraria: o valor sempre tem vírgula.
    expect(paraGrade('"a","R$ 15,00","b"', VIRGULA_CITADA)).toEqual([
      ["a", "R$ 15,00", "b"],
    ]);
  });

  it('transforma "" em uma aspa literal', () => {
    expect(paraGrade('"diz ""oi"" aqui"', VIRGULA_CITADA)).toEqual([
      ['diz "oi" aqui'],
    ]);
  });

  it("mistura campo citado e não citado na mesma linha", () => {
    expect(paraGrade('a,"b,c",d', VIRGULA_CITADA)).toEqual([["a", "b,c", "d"]]);
  });

  it("trata quebra de linha dentro de aspas como conteúdo", () => {
    expect(paraGrade('"linha1\nlinha2",b', VIRGULA_CITADA)).toEqual([
      ["linha1\nlinha2", "b"],
    ]);
  });

  it("preserva aspas no meio de campo já começado, sem lançar erro", () => {
    expect(paraGrade('ab"cd', VIRGULA_CITADA)).toEqual([['ab"cd']]);
  });

  it("fecha implicitamente aspas não terminadas, em vez de travar", () => {
    expect(paraGrade('"sem fim', VIRGULA_CITADA)).toEqual([["sem fim"]]);
  });

  it("lê a amostra da fatura, com BOM, sem sujar o cabeçalho", () => {
    const grade = paraGrade(decodificar(bytes(FATURA_INTER)), VIRGULA_CITADA);

    expect(grade[0]).toEqual([
      "Data",
      "Lançamento",
      "Categoria",
      "Tipo",
      "Valor",
    ]);
    expect(grade[1][4]).toBe("R$ 15,00");
    expect(grade[2][3]).toBe("Parcela 1/2");
    expect(grade[3][4]).toBe("-R$ 318,19");
  });

  it("sem remover o BOM, o cabeçalho não seria reconhecível", () => {
    // Documenta por que `decodificar` existe: a A2 compara "Data" com igualdade.
    const grade = paraGrade(FATURA_INTER, VIRGULA_CITADA);
    expect(grade[0][0]).not.toBe("Data");
  });
});

describe("paraGrade — bordas", () => {
  it("arquivo vazio vira grade vazia", () => {
    expect(paraGrade("", PONTO_E_VIRGULA)).toEqual([]);
    expect(paraGrade("", VIRGULA_CITADA)).toEqual([]);
  });

  it("arquivo só com BOM vira grade vazia", () => {
    expect(paraGrade(decodificar(bytes("﻿")), VIRGULA_CITADA)).toEqual([]);
  });

  it("aceita \\r\\n sem deixar \\r sobrando na última célula", () => {
    expect(paraGrade("a;b\r\nc;d", PONTO_E_VIRGULA)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
    expect(paraGrade("a,b\r\nc,d", VIRGULA_CITADA)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("aceita última linha sem quebra", () => {
    expect(paraGrade("a;b\nc;d", PONTO_E_VIRGULA)).toHaveLength(2);
    expect(paraGrade("a,b\nc,d", VIRGULA_CITADA)).toHaveLength(2);
  });

  it("os dois modos concordam num arquivo simples", () => {
    // Se divergissem aqui, a A2 não poderia comparar cabeçalhos entre dialetos.
    expect(paraGrade("a;b\n", PONTO_E_VIRGULA)).toEqual(
      paraGrade("a,b\n", VIRGULA_CITADA),
    );
  });

  it("não sabe nada de dinheiro: devolve o valor como veio", () => {
    expect(paraGrade("x;1.200,00", PONTO_E_VIRGULA)[0][1]).toBe("1.200,00");
    expect(paraGrade('"R$ 15,00"', VIRGULA_CITADA)[0][0]).toBe("R$ 15,00");
  });
});
