import { describe, expect, it } from "vitest";
import { lerPercentual, paraOCampo } from "./percentual";

describe("campo vazio é sem meta, e é um sucesso", () => {
  it.each(["", "   ", "\n", "\t "])("%j tira a meta do pote", (texto) => {
    expect(lerPercentual(texto)).toEqual({ ok: true, percentual: null });
  });
});

describe("zero é meta de zero, e não ausência de meta", () => {
  /*
   * ⚠ **O teste que a spec 13 mais precisa que exista** (Descoberta 5).
   *
   * Se um dia `"0"` passar a devolver `percentual: null`, o pote sai do
   * julgamento em vez de estourar em tudo — e a tela não tem como avisar,
   * porque as duas coisas se parecem no banco. Só este teste separa.
   */
  it("não devolve null", () => {
    const lido = lerPercentual("0");

    expect(lido).toEqual({ ok: true, percentual: 0 });
    expect(lido.ok && lido.percentual).not.toBeNull();
  });
});

describe("o que passa", () => {
  it.each([
    ["30", 30],
    ["100", 100],
    ["  30  ", 30],
    ["030", 30],
    ["005", 5],
  ])("%j vira %i", (texto, esperado) => {
    expect(lerPercentual(texto)).toEqual({ ok: true, percentual: esperado });
  });
});

describe("o que é recusado — com frase, e nunca como sem meta", () => {
  it.each([
    "10,5",
    "10.5",
    "-5",
    "+10",
    "abc",
    "<script>",
    "1e2",
    "3 0",
    "０１",
    "10%",
  ])("%j não é um percentual", (texto) => {
    const lido = lerPercentual(texto);

    expect(lido.ok).toBe(false);
    expect(!lido.ok && lido.mensagem.length).toBeGreaterThan(0);
  });

  it.each(["101", "999"])("%j está fora da faixa", (texto) => {
    expect(lerPercentual(texto)).toEqual({
      ok: false,
      mensagem: "A meta vai de 0 a 100%.",
    });
  });

  it("string gigante é recusada sem chegar ao Number", () => {
    expect(lerPercentual("1".repeat(5000))).toEqual({
      ok: false,
      mensagem: "A meta vai de 0 a 100%.",
    });
  });

  /*
   * ⚠ **A garantia estrutural**: recusa e "sem meta" são estados diferentes.
   * Nenhuma entrada inválida pode sair daqui parecendo um campo apagado.
   */
  it("nenhuma recusa se disfarça de sem meta", () => {
    for (const texto of ["abc", "-5", "101", "10,5", "1e2"]) {
      expect(lerPercentual(texto)).not.toHaveProperty("percentual");
    }
  });

  it("os dois erros não dão a mesma mensagem", () => {
    const formato = lerPercentual("10,5");
    const faixa = lerPercentual("101");

    expect(!formato.ok && !faixa.ok && formato.mensagem).not.toBe(
      !faixa.ok && faixa.mensagem,
    );
  });
});

describe("a volta para o campo", () => {
  it("sem meta abre o campo vazio", () => {
    expect(paraOCampo(null)).toBe("");
  });

  it.each([0, 5, 30, 100])("%i volta como texto", (percentual) => {
    expect(paraOCampo(percentual)).toBe(String(percentual));
  });

  it("ida e volta não perde o número", () => {
    const lido = lerPercentual("30");

    expect(lido.ok && paraOCampo(lido.percentual)).toBe("30");
  });
});
