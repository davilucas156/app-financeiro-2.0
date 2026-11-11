import { describe, expect, it } from "vitest";
import { estaNaListaDeEmails, normalizarEmail } from "./listaDeEmails";

describe("normalizarEmail", () => {
  it("tira espaço em volta e caixa", () => {
    expect(normalizarEmail("  Alguem@Exemplo.Invalido  ")).toBe(
      "alguem@exemplo.invalido",
    );
  });
});

describe("estaNaListaDeEmails", () => {
  it("variável ausente = ninguém bate", () => {
    expect(estaNaListaDeEmails("alguem@exemplo.invalido", undefined)).toBe(
      false,
    );
  });

  it("lista vazia = ninguém bate", () => {
    expect(estaNaListaDeEmails("alguem@exemplo.invalido", "")).toBe(false);
  });

  it("sem e-mail, nunca bate — mesmo com lista cheia", () => {
    expect(estaNaListaDeEmails(null, "alguem@exemplo.invalido")).toBe(false);
    expect(estaNaListaDeEmails(undefined, "alguem@exemplo.invalido")).toBe(
      false,
    );
  });

  it("compara sem caixa nem espaço em volta, dos dois lados", () => {
    expect(
      estaNaListaDeEmails(
        "ALGUEM@exemplo.invalido",
        "  alguem@EXEMPLO.invalido  ",
      ),
    ).toBe(true);
  });

  it("lista com mais de um e-mail, separados por vírgula", () => {
    const lista = "fulano@exemplo.invalido, alguem@exemplo.invalido";
    expect(estaNaListaDeEmails("alguem@exemplo.invalido", lista)).toBe(true);
    expect(estaNaListaDeEmails("outro@exemplo.invalido", lista)).toBe(false);
  });

  it("vírgula sobrando não gera entrada vazia que bate com nada", () => {
    expect(estaNaListaDeEmails("alguem@exemplo.invalido", ",,")).toBe(false);
  });
});
