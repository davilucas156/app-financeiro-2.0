import { describe, expect, it } from "vitest";
import {
  somarOMes,
  type CategoriaComPote,
  type LancamentoDoMes,
} from "./somarOMes";

/** Potes inventados; a conta não sabe de nome nem de emoji. */
const GASTO = { id: "pote-lazer", tipo: "gasto" as const };
const RENDA = { id: "pote-renda", tipo: "renda" as const };

const CATEGORIAS: CategoriaComPote[] = [
  { id: "cat-comida", pote: GASTO },
  { id: "cat-compras", pote: GASTO },
  { id: "cat-salario", pote: RENDA },
];

let n = 0;
const l = (p: Partial<LancamentoDoMes>): LancamentoDoMes => ({
  id: `t${(n += 1)}`,
  valorCentavos: 10_000,
  direcao: "saida",
  status: "importado",
  categoriaId: "cat-comida",
  ...p,
});

const pote = (soma: ReturnType<typeof somarOMes>, id: string) =>
  soma.potes.find((p) => p.poteId === id);

describe("o que entrou e o que saiu", () => {
  it("não depende de classificação nenhuma", () => {
    // É o número mais confiável da tela, e por isso a B1 o mostra primeiro.
    const soma = somarOMes(
      [
        l({ direcao: "saida", valorCentavos: 3_000, categoriaId: null }),
        l({ direcao: "entrada", valorCentavos: 8_000, categoriaId: null }),
      ],
      CATEGORIAS,
    );

    expect(soma.saiuCentavos).toBe(3_000);
    expect(soma.entrouCentavos).toBe(8_000);
    expect(soma.diferencaCentavos).toBe(5_000);
    expect(soma.potes).toEqual([]);
  });

  it("mês no vermelho dá diferença negativa", () => {
    const soma = somarOMes(
      [
        l({ direcao: "entrada", valorCentavos: 1_000, categoriaId: null }),
        l({ direcao: "saida", valorCentavos: 4_000, categoriaId: null }),
      ],
      CATEGORIAS,
    );

    expect(soma.diferencaCentavos).toBe(-3_000);
  });
});

describe("excluído fica de fora inteiro", () => {
  it("não entra nem no total do mês", () => {
    /*
     * Pagamento de fatura é `excluido`. Contá-lo faria o gasto do cartão sair
     * duas vezes — que é exatamente o que a spec 02 resolveu.
     */
    const soma = somarOMes(
      [
        l({ valorCentavos: 5_000 }),
        l({ valorCentavos: 90_000, status: "excluido", categoriaId: null }),
      ],
      CATEGORIAS,
    );

    expect(soma.saiuCentavos).toBe(5_000);
    expect(soma.lancamentos).toBe(1);
  });

  it("nem no pote, mesmo tendo categoria", () => {
    const soma = somarOMes(
      [l({ valorCentavos: 7_000, status: "excluido" })],
      CATEGORIAS,
    );

    expect(soma.potes).toEqual([]);
  });
});

describe("pote de gasto", () => {
  it("saída soma", () => {
    const soma = somarOMes(
      [l({ valorCentavos: 3_000 }), l({ valorCentavos: 2_500 })],
      CATEGORIAS,
    );

    expect(pote(soma, GASTO.id)?.totalCentavos).toBe(5_500);
    expect(pote(soma, GASTO.id)?.lancamentos).toBe(2);
  });

  it("⚠ entrada ABATE — é o estorno da decisão 2", () => {
    const soma = somarOMes(
      [
        l({ valorCentavos: 10_000, direcao: "saida" }),
        l({ valorCentavos: 4_000, direcao: "entrada" }),
      ],
      CATEGORIAS,
    );

    const p = pote(soma, GASTO.id)!;
    expect(p.saidaCentavos).toBe(10_000);
    expect(p.entradaCentavos).toBe(4_000);
    expect(p.totalCentavos).toBe(6_000);
  });

  it("reembolso maior que o gasto deixa o pote NEGATIVO", () => {
    // Esconder daria um zero que não é verdade.
    const soma = somarOMes(
      [
        l({ valorCentavos: 3_000, direcao: "saida" }),
        l({ valorCentavos: 5_000, direcao: "entrada" }),
      ],
      CATEGORIAS,
    );

    expect(pote(soma, GASTO.id)?.totalCentavos).toBe(-2_000);
  });
});

describe("pote de renda — o sinal inverte", () => {
  it("entrada soma", () => {
    const soma = somarOMes(
      [l({ direcao: "entrada", valorCentavos: 120_000, categoriaId: "cat-salario" })],
      CATEGORIAS,
    );

    expect(pote(soma, RENDA.id)?.totalCentavos).toBe(120_000);
  });

  it("⚠ saída em pote de renda ABATE, e não é ignorada", () => {
    /*
     * "Salário" não tem saída: é erro de classificação. Ignorar seria o começo
     * de um painel que esconde o que não entende. O número fica estranho de
     * propósito — número estranho manda olhar.
     */
    const soma = somarOMes(
      [
        l({ direcao: "entrada", valorCentavos: 100_000, categoriaId: "cat-salario" }),
        l({ direcao: "saida", valorCentavos: 30_000, categoriaId: "cat-salario" }),
      ],
      CATEGORIAS,
    );

    expect(pote(soma, RENDA.id)?.totalCentavos).toBe(70_000);
  });
});

describe("por categoria, dentro do pote", () => {
  it("separa as categorias e soma o pote", () => {
    const soma = somarOMes(
      [
        l({ categoriaId: "cat-comida", valorCentavos: 3_000 }),
        l({ categoriaId: "cat-comida", valorCentavos: 1_000 }),
        l({ categoriaId: "cat-compras", valorCentavos: 6_000 }),
      ],
      CATEGORIAS,
    );

    const p = pote(soma, GASTO.id)!;
    expect(p.totalCentavos).toBe(10_000);
    expect(p.lancamentos).toBe(3);

    const porId = new Map(p.categorias.map((c) => [c.categoriaId, c]));
    expect(porId.get("cat-comida")?.totalCentavos).toBe(4_000);
    expect(porId.get("cat-comida")?.lancamentos).toBe(2);
    expect(porId.get("cat-compras")?.totalCentavos).toBe(6_000);
  });

  it("a categoria também abate", () => {
    const soma = somarOMes(
      [
        l({ categoriaId: "cat-compras", valorCentavos: 9_000, direcao: "saida" }),
        l({ categoriaId: "cat-compras", valorCentavos: 9_000, direcao: "entrada" }),
      ],
      CATEGORIAS,
    );

    const p = pote(soma, GASTO.id)!;
    expect(p.categorias[0].totalCentavos).toBe(0);
    // Zerado, mas os dois lançamentos continuam contados e visíveis.
    expect(p.categorias[0].lancamentos).toBe(2);
  });
});

describe("categoria desconhecida", () => {
  it("vira não classificado, e não exceção", () => {
    /*
     * Só acontece por bug de quem chama (`categoria_id` é `set null` ao apagar
     * a categoria). Estourar derrubaria o painel inteiro por causa de uma
     * linha; o defeito aparece na cobertura em dinheiro, que é o número do
     * topo da tela.
     */
    const soma = somarOMes(
      [l({ categoriaId: "cat-que-nao-veio", valorCentavos: 4_000 })],
      CATEGORIAS,
    );

    expect(soma.potes).toEqual([]);
    expect(soma.saiuCentavos).toBe(4_000);
  });
});

describe("mês vazio", () => {
  it("devolve zeros, e não erro", () => {
    expect(somarOMes([], CATEGORIAS)).toEqual({
      potes: [],
      entrouCentavos: 0,
      saiuCentavos: 0,
      diferencaCentavos: 0,
      lancamentos: 0,
      saiuClassificadoCentavos: 0,
      entrouClassificadoCentavos: 0,
    });
  });
});

describe("o dinheiro classificado, para a cobertura da A2", () => {
  it("conta separado por direção, e só o que caiu num pote", () => {
    const soma = somarOMes(
      [
        l({ direcao: "saida", valorCentavos: 6_000, categoriaId: "cat-comida" }),
        l({ direcao: "saida", valorCentavos: 4_000, categoriaId: null }),
        l({ direcao: "entrada", valorCentavos: 90_000, categoriaId: "cat-salario" }),
        l({ direcao: "entrada", valorCentavos: 10_000, categoriaId: null }),
      ],
      CATEGORIAS,
    );

    expect(soma.saiuCentavos).toBe(10_000);
    expect(soma.saiuClassificadoCentavos).toBe(6_000);
    expect(soma.entrouCentavos).toBe(100_000);
    expect(soma.entrouClassificadoCentavos).toBe(90_000);
  });

  it("o excluído não conta nem como classificado nem como total", () => {
    const soma = somarOMes(
      [l({ valorCentavos: 8_000, status: "excluido", categoriaId: "cat-comida" })],
      CATEGORIAS,
    );

    expect(soma.saiuCentavos).toBe(0);
    expect(soma.saiuClassificadoCentavos).toBe(0);
  });

  it("categoria desconhecida derruba a cobertura — é o alarme", () => {
    const soma = somarOMes(
      [
        l({ valorCentavos: 5_000, categoriaId: "cat-comida" }),
        l({ valorCentavos: 5_000, categoriaId: "cat-que-nao-veio" }),
      ],
      CATEGORIAS,
    );

    expect(soma.saiuClassificadoCentavos).toBe(5_000);
    expect(soma.saiuCentavos).toBe(10_000);
  });
});
