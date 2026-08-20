import { describe, expect, it } from "vitest";
import {
  casarRegra,
  regraValida,
  type AlvoDaRegra,
  type Criterio,
  type Regra,
} from "./regras";

let proximo = 0;

const regra = (criterio: Criterio, prioridade = 50, id?: string): Regra => ({
  id: id ?? `r${String(++proximo).padStart(3, "0")}`,
  criterio,
  categoriaId: "cat",
  prioridade,
});

const alvo = (parcial: Partial<AlvoDaRegra> = {}): AlvoDaRegra => ({
  descricao: "PAGAR ME ESTACIONAMENTO LTDA",
  valorCentavos: 1500,
  direcao: "saida",
  pessoa: null,
  ...parcial,
});

describe("regraValida", () => {
  it("recusa termo vazio", () => {
    // `"".includes("")` é true: um termo vazio classificaria o extrato inteiro
    // numa categoria só, sem avisar ninguém.
    expect(regraValida({ tipo: "descricao_contem", termo: "" })).toBe(false);
    expect(regraValida({ tipo: "descricao_contem", termo: "   " })).toBe(false);
    expect(regraValida({ tipo: "pessoa", nome: "  " })).toBe(false);
  });

  it("recusa faixa de valor sem nenhum limite", () => {
    // Sem mínimo nem máximo isso é "toda saída" — não é regra, é apagão.
    expect(regraValida({ tipo: "valor_direcao", direcao: "saida" })).toBe(false);
  });

  it("recusa faixa invertida", () => {
    expect(
      regraValida({
        tipo: "valor_direcao",
        direcao: "saida",
        minimoCentavos: 5000,
        maximoCentavos: 1000,
      }),
    ).toBe(false);
  });

  it("aceita faixa aberta de um lado só", () => {
    expect(
      regraValida({ tipo: "valor_direcao", direcao: "entrada", minimoCentavos: 100000 }),
    ).toBe(true);
  });

  it("regra inválida nunca casa, mesmo parecendo casar", () => {
    expect(casarRegra([regra({ tipo: "descricao_contem", termo: "" })], alvo())).toBeNull();
  });
});

describe("casarRegra · descricao_contem", () => {
  it("casa ignorando acento e caixa", () => {
    const r = regra({ tipo: "descricao_contem", termo: "estacionamento" });
    expect(casarRegra([r], alvo())?.id).toBe(r.id);

    const comAcento = regra({ tipo: "descricao_contem", termo: "farmácia" });
    expect(casarRegra([comAcento], alvo({ descricao: "DROGARIA FARMACIA SP" }))?.id).toBe(
      comAcento.id,
    );
  });

  it("não casa o que não está lá", () => {
    expect(
      casarRegra([regra({ tipo: "descricao_contem", termo: "uber" })], alvo()),
    ).toBeNull();
  });

  it("termo maior que a descrição não casa nem estoura", () => {
    expect(
      casarRegra(
        [regra({ tipo: "descricao_contem", termo: "PAGAR ME ESTACIONAMENTO LTDA E MAIS" })],
        alvo(),
      ),
    ).toBeNull();
  });
});

describe("casarRegra · pessoa", () => {
  it("casa contra o nome que a A3 extraiu, não contra a descrição", () => {
    const r = regra({ tipo: "pessoa", nome: "Fulana de Tal" });

    // A descrição bruta traz prefixo do banco e número de conta; quem separa o
    // nome é a A3.
    const comPessoa = alvo({
      descricao: 'Pix enviado: "Cp :00000000-Fulana de Tal"',
      pessoa: "Fulana de Tal",
    });

    expect(casarRegra([r], comPessoa)?.id).toBe(r.id);
  });

  it("alvo sem pessoa simplesmente não casa", () => {
    const r = regra({ tipo: "pessoa", nome: "Fulana de Tal" });
    expect(casarRegra([r], alvo({ pessoa: null }))).toBeNull();
    expect(casarRegra([r], alvo({ pessoa: undefined }))).toBeNull();
  });
});

describe("casarRegra · valor_direcao", () => {
  const entradaAlta: Criterio = {
    tipo: "valor_direcao",
    direcao: "entrada",
    minimoCentavos: 100000,
  };

  it("exige a direção certa", () => {
    expect(
      casarRegra([regra(entradaAlta)], alvo({ direcao: "saida", valorCentavos: 500000 })),
    ).toBeNull();
  });

  it("o limite é inclusivo — 'R$ 1.000 ou mais' é como se fala", () => {
    const r = regra(entradaAlta);
    expect(casarRegra([r], alvo({ direcao: "entrada", valorCentavos: 100000 }))?.id).toBe(
      r.id,
    );
    expect(
      casarRegra([r], alvo({ direcao: "entrada", valorCentavos: 99999 })),
    ).toBeNull();
  });

  it("faixa fechada respeita os dois lados", () => {
    const r = regra({
      tipo: "valor_direcao",
      direcao: "saida",
      minimoCentavos: 1000,
      maximoCentavos: 2000,
    });

    expect(casarRegra([r], alvo({ valorCentavos: 1000 }))?.id).toBe(r.id);
    expect(casarRegra([r], alvo({ valorCentavos: 2000 }))?.id).toBe(r.id);
    expect(casarRegra([r], alvo({ valorCentavos: 2001 }))).toBeNull();
  });
});

describe("quem ganha quando duas batem", () => {
  it("prioridade menor vence, mesmo sendo a menos específica", () => {
    const generica = regra({ tipo: "descricao_contem", termo: "PAGAR" }, 10);
    const especifica = regra(
      { tipo: "descricao_contem", termo: "PAGAR ME ESTACIONAMENTO" },
      20,
    );

    expect(casarRegra([especifica, generica], alvo())?.id).toBe(generica.id);
  });

  it("empatada a prioridade, o termo mais longo vence", () => {
    const generica = regra({ tipo: "descricao_contem", termo: "PAGAR ME" }, 50);
    const especifica = regra(
      { tipo: "descricao_contem", termo: "PAGAR ME ESTACIONAMENTO" },
      50,
    );

    expect(casarRegra([generica, especifica], alvo())?.id).toBe(especifica.id);
  });

  it("faixa de valor perde de qualquer regra de texto na mesma prioridade", () => {
    // Especificidade zero de propósito: numa faixa não há texto, e ela é a
    // mais genérica das três.
    const faixa = regra(
      { tipo: "valor_direcao", direcao: "saida", minimoCentavos: 100 },
      50,
    );
    const texto = regra({ tipo: "descricao_contem", termo: "LTDA" }, 50);

    expect(casarRegra([faixa, texto], alvo())?.id).toBe(texto.id);
  });

  it("empate total resolve pelo id, e não pela ordem da lista", () => {
    const a = regra({ tipo: "descricao_contem", termo: "PAGAR" }, 50, "aaa");
    const b = regra({ tipo: "descricao_contem", termo: "LTDA1" }, 50, "bbb");

    // Mesmo comprimento, mesma prioridade. A ordem em que o banco devolveu as
    // linhas não pode mudar em que categoria o seu dinheiro cai.
    const naOrdem = casarRegra([a, b], alvo())?.id;
    const invertida = casarRegra([b, a], alvo())?.id;

    expect(naOrdem).toBe(invertida);
  });

  it("não muda a lista que recebeu", () => {
    // `sort` mexe no array original. Se a lista de regras vier de um cache
    // compartilhado, reordená-la é um bug que só aparece na segunda chamada.
    const lista = [
      regra({ tipo: "descricao_contem", termo: "PAGAR" }, 90),
      regra({ tipo: "descricao_contem", termo: "LTDA" }, 10),
    ];
    const antes = lista.map((r) => r.id);

    casarRegra(lista, alvo());

    expect(lista.map((r) => r.id)).toEqual(antes);
  });
});

describe("o mês normal de quem começou ontem", () => {
  it("sem nenhuma regra, devolve nada — e isso não é erro", () => {
    expect(casarRegra([], alvo())).toBeNull();
  });
});
