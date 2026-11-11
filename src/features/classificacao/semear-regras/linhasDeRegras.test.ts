import { describe, expect, it } from "vitest";
import { POTES_PADRAO } from "@/features/onboarding/potes-padrao";
import { linhasDeRegras } from "./linhasDeRegras";

/** ⚠ Nenhum e-mail nem nome real: os do Davi ficam em variável de ambiente. */
const DONO = { email: "dono@exemplo.invalido", nome: "Titular Da Conta" };

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

/*
 * `recebeRegras` entra como booleano já decidido: `quemRecebe.ts` leva
 * `import "server-only"` (quem decide é `concluirOnboarding.service.ts`), e
 * isso tira de cena qualquer teste direto do parsing de e-mail/variável de
 * ambiente por aqui. Esse parsing é compartilhado com `allowlist.ts` e tem
 * teste próprio no módulo comum.
 */

describe("quem recebe as regras-base (D7)", () => {
  it("decisão negativa não semeia ninguém", () => {
    // O lado seguro para errar: conta sem regras pergunta tudo na revisão;
    // conta com as regras erradas classifica em silêncio.
    expect(linhasDeRegras("u1", DONO, idPorChave, false)).toEqual([]);
  });
});

describe("as linhas que vão para o banco", () => {
  it("toda regra nasce marcada como seed", () => {
    const linhas = linhasDeRegras("u1", DONO, idPorChave, true);

    expect(linhas.length).toBeGreaterThan(20);
    expect(linhas.every((l) => l.origem === "seed")).toBe(true);
    expect(linhas.every((l) => l.userId === "u1")).toBe(true);
  });

  it("nenhuma chave repetida — o `(user_id, chave)` único não estouraria", () => {
    const chaves = linhasDeRegras("u1", DONO, idPorChave, true).map(
      (l) => l.chave,
    );

    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("o `tipo_regra` da coluna é o mesmo do json", () => {
    // A coluna é redundante com o `criterio` de propósito (C1): é por ela que
    // o índice e o `check` funcionam. Divergir seria um estado impossível.
    for (const l of linhasDeRegras("u1", DONO, idPorChave, true)) {
      expect(l.tipoRegra).toBe(l.criterio.tipo);
    }
  });

  it("sem nome do titular, a regra de transferência para si mesmo não entra", () => {
    const comNome = linhasDeRegras("u1", DONO, idPorChave, true);
    const semNome = linhasDeRegras(
      "u1",
      { ...DONO, nome: null },
      idPorChave,
      true,
    );

    expect(comNome.length).toBe(semNome.length + 1);
  });

  it("categoria que não existe derruba a regra, e não gera regra órfã", () => {
    expect(linhasDeRegras("u1", DONO, new Map(), true)).toEqual([]);
  });
});
