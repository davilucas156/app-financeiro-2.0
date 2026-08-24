import { describe, expect, it } from "vitest";
import {
  agruparParaGerir,
  oQueDependeDela,
  podeMover,
  type CategoriaNaGestao,
  type PoteNaGestao,
} from "./categoriasNaTela";

const pote = (id: string, ordem: number): PoteNaGestao => ({
  id,
  slug: id,
  nome: id,
  emoji: "🫙",
  cor: "#fff",
  tipo: "gasto",
  ordem,
});

const categoria = (
  id: string,
  poteId: string,
  ordem: number,
  extra: Partial<CategoriaNaGestao> = {},
): CategoriaNaGestao => ({
  id,
  nome: id,
  emoji: "🧪",
  ordem,
  poteId,
  lancamentos: 0,
  foraDoCalculo: 0,
  regras: 0,
  ...extra,
});

describe("agruparParaGerir", () => {
  it("mantém o pote sem categoria nenhuma", () => {
    // ⚠ O ponto inteiro da função. Agrupando pelas categorias, este pote
    // sumiria — e sumiria da única tela onde daria para criar uma categoria
    // dentro dele. Ficaria inalcançável para sempre.
    const grupos = agruparParaGerir(
      [pote("cheio", 1), pote("vazio", 2)],
      [categoria("a", "cheio", 1)],
    );

    expect(grupos).toHaveLength(2);
    expect(grupos[1].pote.id).toBe("vazio");
    expect(grupos[1].categorias).toEqual([]);
  });

  it("respeita a ordem dos potes e a das categorias dentro deles", () => {
    const grupos = agruparParaGerir(
      [pote("segundo", 2), pote("primeiro", 1)],
      [
        categoria("z", "primeiro", 2),
        categoria("a", "primeiro", 1),
        categoria("b", "segundo", 1),
      ],
    );

    expect(grupos.map((g) => g.pote.id)).toEqual(["primeiro", "segundo"]);
    expect(grupos[0].categorias.map((c) => c.id)).toEqual(["a", "z"]);
  });

  it("ignora categoria de um pote que não está na lista", () => {
    // Não deve inventar um grupo: a lista de potes é a verdade sobre quais
    // existem.
    const grupos = agruparParaGerir(
      [pote("unico", 1)],
      [categoria("a", "unico", 1), categoria("orfa", "sumido", 1)],
    );

    expect(grupos).toHaveLength(1);
    expect(grupos[0].categorias.map((c) => c.id)).toEqual(["a"]);
  });

  it("devolve lista vazia quando não há pote", () => {
    expect(agruparParaGerir([], [])).toEqual([]);
  });
});

describe("podeMover", () => {
  it("libera a categoria vazia", () => {
    expect(podeMover(categoria("a", "p", 1))).toBe(true);
  });

  it("trava a categoria com lançamento, mesmo excluído", () => {
    // "Vazia" conta os excluídos: um lançamento fora do cálculo continua
    // sendo passado, e mover reescreveria o rateio de todos os meses.
    const so = categoria("a", "p", 1, { lancamentos: 1, foraDoCalculo: 1 });

    expect(podeMover(so)).toBe(false);
  });
});

describe("oQueDependeDela", () => {
  it("diz quando ninguém depende", () => {
    expect(oQueDependeDela(categoria("a", "p", 1))).toBe("nunca foi usada");
  });

  it("junta os dois números", () => {
    const c = categoria("a", "p", 1, { lancamentos: 12, regras: 2 });

    expect(oQueDependeDela(c)).toBe("12 lançamentos · 2 regras");
  });

  it("não mostra o zero do outro lado", () => {
    const c = categoria("a", "p", 1, { regras: 3 });

    expect(oQueDependeDela(c)).toBe("3 regras");
  });

  it("no singular", () => {
    const c = categoria("a", "p", 1, { lancamentos: 1, regras: 1 });

    expect(oQueDependeDela(c)).toBe("1 lançamento · 1 regra");
  });
});
