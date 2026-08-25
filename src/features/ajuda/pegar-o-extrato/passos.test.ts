import { describe, expect, it } from "vitest";
import { FORMATOS } from "@/features/upload/ler-arquivo/formatos";
import { ajudaPorBanco, arquivosDoBanco } from "./passos";

describe("a ajuda só promete o que o app lê (spec 09, C1)", () => {
  it("⚠ a lista de bancos sai de FORMATOS, e não de texto escrito à mão", () => {
    /*
     * É a garantia inteira desta tela. Um passo a passo que diga "abra o app do
     * seu banco" está errado para todo mundo cujo CSV o app recusa — e a pessoa
     * só descobre depois de fazer os cinco passos e levar a recusa.
     *
     * Quando o Davi acrescentar o segundo banco, este teste passa a exigir que
     * ele apareça na tela.
     */
    const daAjuda = ajudaPorBanco().map((a) => a.banco);
    const dosFormatos = [...new Set(FORMATOS.map((f) => f.banco))];

    expect([...daAjuda].sort()).toEqual([...dosFormatos].sort());
  });

  it("cada banco listado tem pelo menos um arquivo", () => {
    for (const { banco } of ajudaPorBanco()) {
      expect(arquivosDoBanco(banco).length, banco).toBeGreaterThan(0);
    }
  });

  it("hoje o app lê dois arquivos, e os dois são do Inter", () => {
    // Não é uma afirmação sobre o futuro: é a medição de hoje, e o dia em que
    // ela falhar é o dia em que alguém precisa escrever os passos do banco novo.
    const ajuda = ajudaPorBanco();

    expect(ajuda).toHaveLength(1);
    expect(ajuda[0].banco).toBe("Banco Inter");
    expect(arquivosDoBanco("Banco Inter")).toHaveLength(2);
  });

  it("o Inter tem passos escritos", () => {
    expect(ajudaPorBanco()[0].passos.length).toBeGreaterThan(0);
  });

  it("banco sem passos escritos não some da tela", () => {
    /*
     * O caso é o do banco cujo formato entrou em `FORMATOS` antes de alguém
     * escrever o caminho até o arquivo. Ele continua listado, com `passos`
     * vazio, e a tela diz isso — silêncio ali seria pior que uma frase
     * incompleta, porque a pessoa concluiria que o banco dela não serve.
     */
    const semPassos = ajudaPorBanco().filter((a) => a.passos.length === 0);

    for (const a of semPassos) {
      expect(arquivosDoBanco(a.banco).length).toBeGreaterThan(0);
    }
  });
});
