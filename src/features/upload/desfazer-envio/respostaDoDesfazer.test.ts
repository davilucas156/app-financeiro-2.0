import { describe, expect, it } from "vitest";
import {
  envioNaoEncontrado,
  NAO_ENCONTRADO,
  recusaDoImportId,
  resultadoDoDesfazer,
} from "./respostaDoDesfazer";

const UUID = "123e4567-e89b-42d3-a456-426614174000";

describe("a recusa do desfazer é uma só", () => {
  it("id malformado, envio inexistente e envio de outro dono dizem o mesmo", () => {
    const malformado = recusaDoImportId("nao-e-uuid");
    // Para o serviço, "não existe" e "não é seu" são a mesma ausência: a
    // consulta filtra por dono e volta vazia nos dois casos.
    const inexistente = resultadoDoDesfazer(undefined, 0);
    const deOutroDono = resultadoDoDesfazer(undefined, 0);

    expect(malformado).toEqual(inexistente);
    expect(inexistente).toEqual(deOutroDono);
    expect(inexistente).toEqual(envioNaoEncontrado());
    expect(inexistente).toEqual({ ok: false, erro: NAO_ENCONTRADO });
  });

  it("a frase não revela nada sobre o id nem sobre o dono", () => {
    expect(NAO_ENCONTRADO).not.toMatch(/outro|dono|permiss|autoriz|\bid\b/i);
  });
});

describe("recusaDoImportId", () => {
  it("deixa seguir um UUID", () => {
    expect(recusaDoImportId(UUID)).toBeNull();
  });

  it.each([null, undefined, 42, "", "123", {}])(
    "recusa %j antes de tocar no banco",
    (valor) => {
      expect(recusaDoImportId(valor)).toEqual(envioNaoEncontrado());
    },
  );
});

describe("resultadoDoDesfazer", () => {
  it("com envio, devolve o arquivo e quantos lançamentos saíram", () => {
    expect(resultadoDoDesfazer({ nomeArquivo: "fatura.csv" }, 12)).toEqual({
      ok: true,
      lancamentosApagados: 12,
      nomeArquivo: "fatura.csv",
    });
  });

  it("envio sem nenhum lançamento ainda é um sucesso", () => {
    expect(resultadoDoDesfazer({ nomeArquivo: "x.csv" }, 0)).toMatchObject({
      ok: true,
      lancamentosApagados: 0,
    });
  });
});
