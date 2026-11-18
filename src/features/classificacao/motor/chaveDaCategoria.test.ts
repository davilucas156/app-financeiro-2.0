import { describe, expect, it } from "vitest";
import {
  chaveDaCategoria,
  mapaDeIdPorChave,
  prefixoDoPote,
} from "./chaveDaCategoria";

describe("chaveDaCategoria · o contrato com a semente e as sugestões", () => {
  it("é `pote/categoria`, nessa ordem", () => {
    expect(chaveDaCategoria("custos-fixos", "telefonia")).toBe(
      "custos-fixos/telefonia",
    );
  });

  it("o prefixo do pote é `pote/`", () => {
    expect(prefixoDoPote("transporte")).toBe("transporte/");
  });

  it("toda chave do pote começa pelo prefixo dele", () => {
    const chave = chaveDaCategoria("transporte", "gasolina");

    expect(chave.startsWith(prefixoDoPote("transporte"))).toBe(true);
    expect(chave.startsWith(prefixoDoPote("custos-fixos"))).toBe(false);
  });

  it("o mesmo slug em dois potes gera chaves diferentes", () => {
    expect(chaveDaCategoria("custos-fixos", "assinaturas")).not.toBe(
      chaveDaCategoria("conforto-lazer", "assinaturas"),
    );
  });
});

describe("mapaDeIdPorChave", () => {
  it("traduz chave em id", () => {
    const mapa = mapaDeIdPorChave([
      { chave: chaveDaCategoria("transporte", "gasolina"), id: "id-1" },
      { chave: chaveDaCategoria("custos-fixos", "telefonia"), id: "id-2" },
    ]);

    expect(mapa.get("transporte/gasolina")).toBe("id-1");
    expect(mapa.get("custos-fixos/telefonia")).toBe("id-2");
    expect(mapa.get("telefonia")).toBeUndefined();
  });
});
