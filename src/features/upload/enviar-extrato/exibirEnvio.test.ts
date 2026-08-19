import { describe, expect, it } from "vitest";
import {
  enviadoEmPtBr,
  paraEnvioExibido,
  type LinhaDeImportacao,
} from "./exibirEnvio";

const linha = (parcial: Partial<LinhaDeImportacao> = {}): LinhaDeImportacao => ({
  id: "3f2b",
  mesReferencia: "2026-06",
  origem: "csv_conta",
  nomeArquivo: "Extrato-02-06-2026-a-02-07-2026-CSV.csv",
  lancamentosImportados: 21,
  ignoradas: [],
  criadoEm: new Date("2026-08-19T00:12:00Z"),
  ...parcial,
});

describe("enviadoEmPtBr", () => {
  it("mostra o horário de São Paulo, não o do servidor", () => {
    // 00h12 UTC do dia 19 são 21h12 do dia **18** em São Paulo. Rodando na
    // Vercel (UTC), sem fixar o fuso isto diria "19/08 às 00h" — dia errado.
    expect(enviadoEmPtBr(new Date("2026-08-19T00:12:00Z"))).toBe("18/08 às 21h");
  });

  it("não muda de dia quando o instante já é o mesmo dia nos dois fusos", () => {
    expect(enviadoEmPtBr(new Date("2026-08-18T14:00:00Z"))).toBe("18/08 às 11h");
  });

  it("meia-noite em São Paulo sai como 00h, nunca 24h", () => {
    // 03h UTC = 00h em São Paulo.
    expect(enviadoEmPtBr(new Date("2026-06-10T03:00:00Z"))).toBe("10/06 às 00h");
  });

  it("dia e mês vêm com dois dígitos", () => {
    expect(enviadoEmPtBr(new Date("2026-03-05T15:00:00Z"))).toBe("05/03 às 12h");
  });
});

describe("paraEnvioExibido", () => {
  it("traduz a origem para a palavra que aparece na tela", () => {
    expect(paraEnvioExibido(linha()).rotuloDeOrigem).toBe("conta");
    expect(paraEnvioExibido(linha({ origem: "csv_cartao" })).rotuloDeOrigem).toBe(
      "cartão",
    );
  });

  it("carrega o resto sem inventar nada", () => {
    expect(paraEnvioExibido(linha())).toEqual({
      id: "3f2b",
      mes: "2026-06",
      rotuloDeOrigem: "conta",
      nomeArquivo: "Extrato-02-06-2026-a-02-07-2026-CSV.csv",
      lancamentos: 21,
      ignoradas: [],
      enviadoEm: "18/08 às 21h",
    });
  });

  it("carrega o motivo de cada linha ignorada, e não só quantas foram", () => {
    // É o ponto todo da coluna: "3 ignoradas" meses depois não permite fazer
    // nada a respeito.
    const ignoradas = [
      { linha: 12, motivo: "data inválida", conteudo: "31/02/2026;X;-10,00" },
    ];

    expect(paraEnvioExibido(linha({ ignoradas })).ignoradas).toEqual(ignoradas);
  });

  it("um envio sem nenhuma linha válida aparece com zero", () => {
    // Esconder seria pior: o envio aconteceu e a D5 precisa de um alvo para
    // desfazer.
    expect(paraEnvioExibido(linha({ lancamentosImportados: 0 })).lancamentos).toBe(
      0,
    );
  });
});
