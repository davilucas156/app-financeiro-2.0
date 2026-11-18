import { describe, expect, it } from "vitest";
import { linkEnviarCsvDeOutroBanco } from "./contato";

describe("linkEnviarCsvDeOutroBanco", () => {
  it("é um mailto com o assunto 'CSV de outro banco' codificado", () => {
    const href = linkEnviarCsvDeOutroBanco();

    expect(href.startsWith("mailto:")).toBe(true);
    expect(href).toContain("?subject=CSV%20de%20outro%20banco");
  });
});
