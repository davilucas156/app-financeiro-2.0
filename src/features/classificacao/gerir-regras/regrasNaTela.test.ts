import { describe, expect, it } from "vitest";
import { chaveDoCriterio } from "@/features/classificacao/motor/chaveDaRegra";
import { casarRegra, type Criterio } from "@/features/classificacao/motor/regras";
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
const porValor: Criterio = { tipo: "valor_direcao", direcao: "saida", minimoCentavos: 100 };

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
    const regra = { id: "r", criterio: novo!, categoriaId: "c", prioridade: 10 };
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
