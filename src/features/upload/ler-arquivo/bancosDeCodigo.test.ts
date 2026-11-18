import { describe, expect, it } from "vitest";
import { bancosDeCodigo } from "./bancosDeCodigo";
import { FORMATOS } from "./formatos";

describe("bancosDeCodigo", () => {
  it("lista os bancos em ordem alfabética pt-BR", () => {
    const bancos = bancosDeCodigo().map((b) => b.banco);

    expect(bancos).toEqual(
      [...bancos].sort((a, b) => a.localeCompare(b, "pt-BR")),
    );
  });

  it("não repete banco", () => {
    const bancos = bancosDeCodigo().map((b) => b.banco);

    expect(new Set(bancos).size).toBe(bancos.length);
  });

  it("cobre todos os bancos de FORMATOS", () => {
    const daLista = bancosDeCodigo().map((b) => b.banco);
    const dosFormatos = [...new Set(FORMATOS.map((f) => f.banco))];

    expect([...daLista].sort()).toEqual([...dosFormatos].sort());
  });

  it("os arquivos de cada banco batem com FORMATOS", () => {
    for (const { banco, arquivos } of bancosDeCodigo()) {
      const esperados = FORMATOS.filter((f) => f.banco === banco).map(
        (f) => f.nome,
      );

      expect(arquivos, banco).toEqual(esperados);
      expect(arquivos.length, banco).toBeGreaterThan(0);
    }
  });
});
