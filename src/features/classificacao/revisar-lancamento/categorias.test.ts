import { describe, expect, it } from "vitest";
import {
  agruparPorPote,
  comparavel,
  filtrarCategorias,
  type CategoriaEscolhivel,
  type PoteEscolhivel,
} from "./categorias";

const pote = (
  id: string,
  nome: string,
  ordem: number,
  tipo: PoteEscolhivel["tipo"] = "gasto",
): PoteEscolhivel => ({
  id,
  slug: id,
  nome,
  emoji: "•",
  cor: "#000000",
  tipo,
  ordem,
});

const categoria = (
  id: string,
  nome: string,
  ordem: number,
  p: PoteEscolhivel,
): CategoriaEscolhivel => ({
  id,
  chave: `${p.slug}/${id}`,
  nome,
  emoji: "•",
  ordem,
  pote: p,
});

const conforto = pote("conforto-lazer", "Conforto e lazer", 2);
const moradia = pote("moradia", "Moradia", 1);
const renda = pote("renda", "Renda", 9, "renda");

const categorias = [
  categoria("alimentacao-fora", "Alimentação fora", 2, conforto),
  categoria("acai", "Açaí", 1, conforto),
  categoria("aluguel", "Aluguel", 1, moradia),
  categoria("renda-extra", "Renda extra", 1, renda),
];

describe("agruparPorPote", () => {
  it("em saída, põe renda no fim e os potes de gasto na ordem do pote", () => {
    const nomes = agruparPorPote(categorias, "saida").map((g) => g.pote.nome);

    expect(nomes).toEqual(["Moradia", "Conforto e lazer", "Renda"]);
  });

  it("em entrada, põe renda na frente", () => {
    const nomes = agruparPorPote(categorias, "entrada").map((g) => g.pote.nome);

    expect(nomes).toEqual(["Renda", "Moradia", "Conforto e lazer"]);
  });

  it("ordena as categorias dentro do pote pela ordem delas", () => {
    const grupo = agruparPorPote(categorias, "saida").find(
      (g) => g.pote.id === "conforto-lazer",
    );

    expect(grupo?.categorias.map((c) => c.id)).toEqual([
      "acai",
      "alimentacao-fora",
    ]);
  });
});

describe("comparavel", () => {
  it("tira acento, caixa e espaço das pontas", () => {
    expect(comparavel("  Açaí ")).toBe("acai");
  });
});

describe("filtrarCategorias", () => {
  it("acha pelo nome com acento escrito sem acento", () => {
    const achadas = filtrarCategorias(categorias, "acai");

    expect(achadas?.map((c) => c.id)).toEqual(["acai"]);
  });

  it("acha pelo nome do pote, e não só pelo da categoria", () => {
    const achadas = filtrarCategorias(categorias, "moradia");

    expect(achadas?.map((c) => c.id)).toEqual(["aluguel"]);
  });

  it("devolve null para busca vazia, para a tela mostrar os potes", () => {
    expect(filtrarCategorias(categorias, "")).toBeNull();
    expect(filtrarCategorias(categorias, "   ")).toBeNull();
  });

  it("devolve lista vazia quando nada bate", () => {
    expect(filtrarCategorias(categorias, "xyz")).toEqual([]);
  });
});
