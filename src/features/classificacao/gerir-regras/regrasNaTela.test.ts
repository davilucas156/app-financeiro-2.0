import { describe, expect, it } from "vitest";
import type { Criterio } from "@/features/classificacao/motor/regras";
import {
  erroDoTamanhoDoTexto,
  oQueEstaRegraProcura,
  TAMANHO_MAXIMO_DO_TEXTO_DA_REGRA,
  textoEditavelDe,
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
});

describe("tamanho do texto da regra (S12)", () => {
  const max = TAMANHO_MAXIMO_DO_TEXTO_DA_REGRA;

  it("texto no limite passa", () => {
    expect(erroDoTamanhoDoTexto("A".repeat(max), "PETROBRAS")).toBeNull();
  });

  it("texto com um caractere a mais é recusado, com o limite na mensagem", () => {
    expect(erroDoTamanhoDoTexto("A".repeat(max + 1), "PETROBRAS")).toBe(
      `O texto da regra pode ter no máximo ${max} caracteres.`,
    );
  });

  it("espaço nas pontas não conta (o servidor grava o texto aparado)", () => {
    expect(erroDoTamanhoDoTexto(` ${"A".repeat(max)} `, "X")).toBeNull();
  });

  it("texto maior que o limite, mas igual ao já gravado, passa", () => {
    // Regra que o próprio app criou maior que o teto: trocar só o destino
    // reenvia o texto como está.
    const longo = "A".repeat(max + 30);
    expect(erroDoTamanhoDoTexto(longo, longo)).toBeNull();
  });

  it("o texto editável sai do termo ou do nome, e é vazio por valor", () => {
    expect(textoEditavelDe(contem)).toBe("PETROBRAS");
    expect(textoEditavelDe(pessoa)).toBe("FULANA DE TAL");
    expect(textoEditavelDe(porValor)).toBe("");
  });
});
