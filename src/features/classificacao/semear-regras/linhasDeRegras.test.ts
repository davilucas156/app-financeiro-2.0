import { afterEach, describe, expect, it } from "vitest";
import { POTES_PADRAO } from "@/features/onboarding/potes-padrao";
import { linhasDeRegras } from "./linhasDeRegras";

/** ⚠ Nenhum e-mail nem nome real: os do Davi ficam em variável de ambiente. */
const DONO = { email: "dono@exemplo.invalido", nome: "Titular Da Conta" };
const OUTRO = { email: "outro@exemplo.invalido", nome: "Outra Pessoa" };

const idPorChave = new Map<string, string>(
  POTES_PADRAO.flatMap((pote) =>
    pote.categorias.map(
      (c) =>
        [`${pote.slug}/${c.slug}`, `id:${pote.slug}/${c.slug}`] as [
          string,
          string,
        ],
    ),
  ),
);

const comLista = (lista: string) => {
  process.env.EMAILS_COM_REGRAS_BASE = lista;
};

afterEach(() => {
  delete process.env.EMAILS_COM_REGRAS_BASE;
});

describe("quem recebe as regras-base (D7)", () => {
  it("lista vazia não semeia ninguém", () => {
    // O lado seguro para errar: conta sem regras pergunta tudo na revisão;
    // conta com as regras erradas classifica em silêncio.
    comLista("");
    expect(linhasDeRegras("u1", DONO, idPorChave)).toEqual([]);
  });

  it("conta fora da lista nasce com a tabela vazia", () => {
    // `EDSON` é o mecânico do Davi e `CADILLAC MONTE CARMO` é uma contraparte
    // real. Semear isso em outra conta seria mostrar gente da vida dele na
    // tela de regras de um estranho.
    comLista(DONO.email);
    expect(linhasDeRegras("u2", OUTRO, idPorChave)).toEqual([]);
  });

  it("o e-mail é comparado sem caixa nem espaço em volta", () => {
    comLista(`  ${DONO.email.toUpperCase()}  , alguem@exemplo.invalido`);
    expect(linhasDeRegras("u1", DONO, idPorChave).length).toBeGreaterThan(0);
  });
});

describe("as linhas que vão para o banco", () => {
  it("toda regra nasce marcada como seed", () => {
    comLista(DONO.email);
    const linhas = linhasDeRegras("u1", DONO, idPorChave);

    expect(linhas.length).toBeGreaterThan(20);
    expect(linhas.every((l) => l.origem === "seed")).toBe(true);
    expect(linhas.every((l) => l.userId === "u1")).toBe(true);
  });

  it("nenhuma chave repetida — o `(user_id, chave)` único não estouraria", () => {
    comLista(DONO.email);
    const chaves = linhasDeRegras("u1", DONO, idPorChave).map((l) => l.chave);

    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("o `tipo_regra` da coluna é o mesmo do json", () => {
    // A coluna é redundante com o `criterio` de propósito (C1): é por ela que
    // o índice e o `check` funcionam. Divergir seria um estado impossível.
    comLista(DONO.email);

    for (const l of linhasDeRegras("u1", DONO, idPorChave)) {
      expect(l.tipoRegra).toBe(l.criterio.tipo);
    }
  });

  it("sem nome do titular, a regra de transferência para si mesmo não entra", () => {
    comLista(DONO.email);

    const comNome = linhasDeRegras("u1", DONO, idPorChave);
    const semNome = linhasDeRegras("u1", { ...DONO, nome: null }, idPorChave);

    expect(comNome.length).toBe(semNome.length + 1);
  });

  it("categoria que não existe derruba a regra, e não gera regra órfã", () => {
    comLista(DONO.email);
    expect(linhasDeRegras("u1", DONO, new Map())).toEqual([]);
  });
});
