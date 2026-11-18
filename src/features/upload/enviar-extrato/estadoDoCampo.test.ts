import { describe, expect, it } from "vitest";
import { estadoDoCampo } from "./estadoDoCampo";

const arquivo = { nome: "x.csv" };

describe("estadoDoCampo", () => {
  it("vazio: sem erro, sem envio, sem arquivo", () => {
    expect(
      estadoDoCampo({ erro: null, enviando: false, escolhido: null }),
    ).toBe("vazio");
  });

  it("escolhido: há arquivo e nada mais", () => {
    expect(
      estadoDoCampo({ erro: null, enviando: false, escolhido: arquivo }),
    ).toBe("escolhido");
  });

  it("enviando: o envio em curso trava o campo", () => {
    expect(estadoDoCampo({ erro: null, enviando: true, escolhido: null })).toBe(
      "enviando",
    );
  });

  it("erro: a recusa aparece", () => {
    expect(
      estadoDoCampo({
        erro: "Só aceito .csv",
        enviando: false,
        escolhido: null,
      }),
    ).toBe("erro");
  });

  it("enviando vence escolhido", () => {
    expect(
      estadoDoCampo({ erro: null, enviando: true, escolhido: arquivo }),
    ).toBe("enviando");
  });

  it("erro vence enviando", () => {
    expect(estadoDoCampo({ erro: "x", enviando: true, escolhido: null })).toBe(
      "erro",
    );
  });

  it("erro vence tudo", () => {
    expect(
      estadoDoCampo({ erro: "x", enviando: true, escolhido: arquivo }),
    ).toBe("erro");
  });

  it("erro vazio ou indefinido não conta como erro", () => {
    expect(
      estadoDoCampo({ erro: "", enviando: false, escolhido: arquivo }),
    ).toBe("escolhido");
    expect(
      estadoDoCampo({ erro: undefined, enviando: false, escolhido: null }),
    ).toBe("vazio");
  });
});
