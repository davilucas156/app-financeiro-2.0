import { describe, expect, it } from "vitest";
import {
  letraEscolhida,
  ROTULOS_DO_TAMANHO,
  TAMANHO_PADRAO,
  TAMANHOS,
} from "./letra";

describe("o que veio no cookie vira um dos três tamanhos (spec 10, B1)", () => {
  it("os três valores passam", () => {
    expect(letraEscolhida("padrao")).toBe("padrao");
    expect(letraEscolhida("grande")).toBe("grande");
    expect(letraEscolhida("maior")).toBe("maior");
  });

  it("sem cookie é o padrão", () => {
    expect(letraEscolhida(undefined)).toBe(TAMANHO_PADRAO);
    expect(letraEscolhida(null)).toBe(TAMANHO_PADRAO);
    expect(letraEscolhida("")).toBe(TAMANHO_PADRAO);
  });

  it("⚠ o padrão é `padrao`, e é decisão de não-mudança", () => {
    /*
     * Não é "o primeiro da lista". Ninguém pediu um app maior, e subir com
     * "grande" como padrão aumentaria a letra de todo mundo no deploy — o que
     * se lê como defeito, não como funcionalidade. Mesma lógica do
     * `TEMA_PADRAO` escuro na spec 08.
     *
     * Se este teste falhar depois de alguém trocar a constante, a pergunta é a
     * pendência 4 da spec 10 — não é um valor a "corrigir".
     */
    expect(TAMANHO_PADRAO).toBe("padrao");
  });

  it("valor desconhecido cai no padrão, sem exceção", () => {
    expect(letraEscolhida("gigante")).toBe(TAMANHO_PADRAO);
    expect(letraEscolhida("large")).toBe(TAMANHO_PADRAO);
    expect(letraEscolhida("<script>")).toBe(TAMANHO_PADRAO);
    expect(letraEscolhida("maior; padrao")).toBe(TAMANHO_PADRAO);
  });

  it("perdoa caixa e espaço", () => {
    expect(letraEscolhida("Grande")).toBe("grande");
    expect(letraEscolhida("  MAIOR  ")).toBe("maior");
  });

  it("o padrão é um dos tamanhos — e não um quarto valor", () => {
    expect(TAMANHOS).toContain(TAMANHO_PADRAO);
  });

  it("⚠ todo tamanho tem rótulo", () => {
    /*
     * Sem isto, acrescentar um degrau em `TAMANHOS` compila e coloca na tela um
     * botão de rádio com o texto vazio — o `Record` do TypeScript exigiria a
     * chave, mas nada exige que ela tenha conteúdo.
     */
    for (const tamanho of TAMANHOS) {
      expect(ROTULOS_DO_TAMANHO[tamanho].titulo).not.toBe("");
      expect(ROTULOS_DO_TAMANHO[tamanho].nota).not.toBe("");
    }
  });

  it("⚠ nenhum valor tem acento ou espaço", () => {
    /*
     * Eles viram conteúdo de cookie e valor de `data-letra` no `<html>`. O
     * seletor de CSS `[data-letra="grande"]` é escrito à mão em `globals.css`:
     * um valor com espaço ou acento chegaria lá e não casaria com nada, e a
     * configuração falharia sem erro nenhum.
     */
    for (const tamanho of TAMANHOS) {
      expect(tamanho).toMatch(/^[a-z]+$/);
    }
  });
});
