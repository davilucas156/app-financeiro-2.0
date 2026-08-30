import { describe, expect, it } from "vitest";
import { METAS_DO_PADRAO, RATEIO_DO_PADRAO } from "./metasDoPadrao";

/**
 * O rateio que a tela **anuncia** é o mesmo que o botão **aplica**.
 *
 * ⚠ **Nasceu de um defeito encontrado na limpeza de 30/08/2026.** O
 * `METAS_DO_PADRAO` lia a semente — de propósito, com o motivo escrito no
 * módulo — e a frase de confirmação ao lado dele tinha `30/25/15/15/10/5`
 * **escrito à mão**. Bastava alguém mexer no `potes-padrao.ts` para a tela
 * prometer um rateio e o botão aplicar outro, sem erro e sem teste vermelho.
 *
 * A conferência de que a lista bate com o que o onboarding grava é outra, e
 * mora em `metaAtravessa.test.ts` — lá são duas derivações independentes da
 * semente. Aqui é só o elo que faltava: da lista até a frase.
 */

const comMeta = () => METAS_DO_PADRAO.filter((m) => m.percentual !== null);

describe("o rateio que a tela anuncia", () => {
  it("sai da mesma lista que o botão aplica", () => {
    expect(RATEIO_DO_PADRAO).toBe(
      comMeta()
        .map((m) => m.percentual)
        .join("/"),
    );
  });

  /* Os potes fora do rateio voltam a não ter meta, e isso a frase diz em
     palavras — não como um "null" no meio dos números. */
  it("não anuncia os potes que voltam a não ter meta", () => {
    expect(RATEIO_DO_PADRAO).not.toContain("null");
    expect(RATEIO_DO_PADRAO.split("/")).toHaveLength(comMeta().length);
  });

  it("é uma lista de inteiros separados por barra", () => {
    expect(RATEIO_DO_PADRAO).toMatch(/^\d+(\/\d+)*$/);
  });
});
