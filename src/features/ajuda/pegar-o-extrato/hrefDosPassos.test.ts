import { describe, expect, it } from "vitest";
import { hrefDosPassos, voltarParaDe } from "./hrefDosPassos";

describe("hrefDosPassos", () => {
  it("sem origem é a rota pura", () => {
    expect(hrefDosPassos()).toBe("/passos");
  });

  it("vindo do upload carrega o ?de=upload", () => {
    expect(hrefDosPassos("upload")).toBe("/passos?de=upload");
  });
});

describe("voltarParaDe", () => {
  it("só a string 'upload' volta para o upload", () => {
    expect(voltarParaDe("upload")).toBe("/upload");
  });

  it("ausente volta para o painel", () => {
    expect(voltarParaDe(undefined)).toBe("/dashboard");
  });

  it("lista de valores volta para o painel", () => {
    expect(voltarParaDe(["upload"])).toBe("/dashboard");
    expect(voltarParaDe(["upload", "upload"])).toBe("/dashboard");
  });

  it("valor desconhecido ou externo volta para o painel", () => {
    expect(voltarParaDe("dashboard")).toBe("/dashboard");
    expect(voltarParaDe("https://exemplo.com")).toBe("/dashboard");
    expect(voltarParaDe("")).toBe("/dashboard");
    expect(voltarParaDe(null)).toBe("/dashboard");
  });

  it("é o inverso de hrefDosPassos('upload')", () => {
    const de = new URL(hrefDosPassos("upload"), "http://x").searchParams.get(
      "de",
    );

    expect(voltarParaDe(de)).toBe("/upload");
  });
});
