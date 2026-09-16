import { describe, expect, it } from "vitest";
import { chaveDoCriterio } from "@/features/classificacao/motor/chaveDaRegra";
import {
  casarRegra,
  type Criterio,
} from "@/features/classificacao/motor/regras";
import {
  comTextoNovo,
  oQueEstaRegraProcura,
  textoEhEditavel,
} from "./regrasNaTela";

const contem: Criterio = { tipo: "descricao_contem", termo: "PETROBRAS" };
const pessoa: Criterio = { tipo: "pessoa", nome: "FULANA DE TAL" };
const pessoaEntrando: Criterio = {
  tipo: "pessoa",
  nome: "EMPRESA IMAGINARIA",
  direcao: "entrada",
};
const porValor: Criterio = {
  tipo: "valor_direcao",
  direcao: "saida",
  minimoCentavos: 100,
};

describe("o que dá para corrigir (D9)", () => {
  it("texto é editável nos dois tipos que têm texto", () => {
    expect(textoEhEditavel(contem)).toBe(true);
    expect(textoEhEditavel(pessoa)).toBe(true);
  });

  it("regra por valor não tem texto para corrigir", () => {
    // `textoDoCriterio` devolve a direção para este tipo. Um campo aqui
    // gravaria lixo.
    expect(textoEhEditavel(porValor)).toBe(false);
    expect(comTextoNovo(porValor, "qualquer coisa")).toBeNull();
  });
});

describe("trocar o texto preserva o resto do critério", () => {
  it("o termo muda e o tipo fica", () => {
    expect(comTextoNovo(contem, "  PETROBRAS DISTRIBUIDORA  ")).toEqual({
      tipo: "descricao_contem",
      termo: "PETROBRAS DISTRIBUIDORA",
    });
  });

  it("⚠ a direção sobrevive à edição do nome", () => {
    /*
     * Duas regras do seed dependem da direção: sem ela, dinheiro que sai para
     * a sua própria conta vira renda, e uma empresa que te paga vira renda
     * quando **você** paga ela. Perder isso ao corrigir uma letra do nome
     * seria classificar errado em silêncio.
     */
    const novo = comTextoNovo(pessoaEntrando, "EMPRESA IMAGINARIA LTDA");

    expect(novo).toEqual({
      tipo: "pessoa",
      nome: "EMPRESA IMAGINARIA LTDA",
      direcao: "entrada",
    });

    // E a prova de que a direção continua fazendo efeito no motor:
    const regra = {
      id: "r",
      criterio: novo!,
      categoriaId: "c",
      prioridade: 10,
    };
    const alvo = {
      descricao: "",
      valorCentavos: 1000,
      pessoa: "EMPRESA IMAGINARIA LTDA",
    };

    expect(casarRegra([regra], { ...alvo, direcao: "entrada" })).not.toBeNull();
    expect(casarRegra([regra], { ...alvo, direcao: "saida" })).toBeNull();
  });

  it("texto vazio não vira regra", () => {
    // Regra que procura por nada casaria com tudo.
    expect(comTextoNovo(contem, "   ")).toBeNull();
    expect(comTextoNovo(pessoa, "")).toBeNull();
  });

  it("o texto novo produz a chave nova — a mesma da D5 e do seed", () => {
    const novo = comTextoNovo(contem, "PETROLINA")!;
    expect(chaveDoCriterio(novo)).toBe("descricao_contem:PETROLINA");
  });
});

describe("o que a tela diz que a regra procura", () => {
  it("sem direção, é só o texto", () => {
    expect(oQueEstaRegraProcura(contem)).toBe("PETROBRAS");
  });

  it("com direção, a direção aparece — ela é metade da regra", () => {
    // "recebido de" e "enviado para" a mesma pessoa vão para potes diferentes.
    expect(oQueEstaRegraProcura(pessoaEntrando)).toBe(
      "recebido de EMPRESA IMAGINARIA",
    );
  });
});

describe("a faixa de valor aparece na frase", () => {
  /*
   * ⚠ Sem isto, uma regra `pessoa: Fulana` restrita a R$ 300,00 apareceria na
   * /regras idêntica a uma sem restrição. As duas convivem na lista de
   * propósito — é o padrão e a exceção — e você editaria a errada.
   */
  it("valor exato", () => {
    expect(
      oQueEstaRegraProcura({
        tipo: "pessoa",
        nome: "Fulana de Tal",
        minimoCentavos: 30000,
        maximoCentavos: 30000,
      }),
    ).toBe("Fulana de Tal, de exatamente R$ 300,00");
  });

  it("faixa dos dois lados", () => {
    expect(
      oQueEstaRegraProcura({
        tipo: "descricao_contem",
        termo: "PETROBRAS",
        minimoCentavos: 10000,
        maximoCentavos: 20000,
      }),
    ).toBe("PETROBRAS, entre R$ 100,00 e R$ 200,00");
  });

  it("aberta de um lado só", () => {
    expect(
      oQueEstaRegraProcura({
        tipo: "descricao_contem",
        termo: "PETROBRAS",
        minimoCentavos: 10000,
      }),
    ).toBe("PETROBRAS, de R$ 100,00 ou mais");

    expect(
      oQueEstaRegraProcura({
        tipo: "descricao_contem",
        termo: "PETROBRAS",
        maximoCentavos: 10000,
      }),
    ).toBe("PETROBRAS, de até R$ 100,00");
  });

  it("convive com a direção, que também faz parte do que a regra procura", () => {
    expect(
      oQueEstaRegraProcura({
        tipo: "pessoa",
        nome: "Fulana de Tal",
        direcao: "entrada",
        minimoCentavos: 30000,
        maximoCentavos: 30000,
      }),
    ).toBe("recebido de Fulana de Tal, de exatamente R$ 300,00");
  });

  it("em `valor_direcao` a faixa não vira prosa — lá ela é a regra inteira", () => {
    // `textoDoCriterio` já devolve a direção, e o rótulo do tipo já diz "por
    // valor". Repetir em prosa seria dizer a mesma coisa três vezes.
    expect(
      oQueEstaRegraProcura({
        tipo: "valor_direcao",
        direcao: "saida",
        minimoCentavos: 20000,
      }),
    ).toBe("saida");
  });

  it("sem faixa, a frase é exatamente a de antes", () => {
    expect(
      oQueEstaRegraProcura({ tipo: "descricao_contem", termo: "PETROBRAS" }),
    ).toBe("PETROBRAS");
  });

  it("editar o texto preserva a faixa", () => {
    // Mesma lição da direção: perder a restrição ao corrigir uma letra do nome
    // faria a exceção virar padrão em silêncio.
    expect(
      comTextoNovo(
        {
          tipo: "pessoa",
          nome: "Fulana",
          minimoCentavos: 30000,
          maximoCentavos: 30000,
        },
        "Fulana de Tal",
      ),
    ).toEqual({
      tipo: "pessoa",
      nome: "Fulana de Tal",
      minimoCentavos: 30000,
      maximoCentavos: 30000,
    });
  });
});
