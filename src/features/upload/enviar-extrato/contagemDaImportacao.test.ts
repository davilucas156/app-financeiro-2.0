import { describe, expect, it } from "vitest";
import {
  paraDecidir,
  tudoResolvido,
  type ContagemDaImportacao,
} from "./contagemDaImportacao";

const contagem = (
  p: Partial<ContagemDaImportacao> = {},
): ContagemDaImportacao => ({
  importados: 0,
  classificados: 0,
  pendentes: 0,
  pares: 0,
  conferir: 0,
  excluidos: 0,
  ...p,
});

describe("paraDecidir", () => {
  it("soma os três tipos de pendência, e não só quem não achou regra", () => {
    // Os números do mês real do Davi, medidos pela A6 e pela D1.
    const junho = contagem({
      importados: 54,
      classificados: 30,
      pendentes: 17,
      pares: 4,
      conferir: 2,
      excluidos: 3,
    });

    expect(paraDecidir(junho)).toBe(23);
  });

  it("cada tipo entra sozinho", () => {
    expect(paraDecidir(contagem({ pendentes: 5 }))).toBe(5);
    expect(paraDecidir(contagem({ pares: 4 }))).toBe(4);
    expect(paraDecidir(contagem({ conferir: 2 }))).toBe(2);
  });

  it("excluído **não** entra: pagamento de fatura não pede decisão", () => {
    expect(paraDecidir(contagem({ excluidos: 3 }))).toBe(0);
  });

  it("classificado sem valor alto **não** entra", () => {
    expect(paraDecidir(contagem({ classificados: 30 }))).toBe(0);
  });
});

describe("tudoResolvido", () => {
  it("mês em que o motor pegou tudo", () => {
    expect(tudoResolvido(contagem({ importados: 40, classificados: 40 }))).toBe(
      true,
    );
  });

  it("um valor alto sozinho já impede o 'tudo pronto'", () => {
    // Senão a tela diria "acabou" e ainda haveria um esperando confirmação.
    expect(tudoResolvido(contagem({ classificados: 40, conferir: 1 }))).toBe(
      false,
    );
  });

  it("um par que se anula também impede", () => {
    expect(tudoResolvido(contagem({ classificados: 40, pares: 1 }))).toBe(
      false,
    );
  });

  it("importação vazia não conta como pendência", () => {
    expect(tudoResolvido(contagem())).toBe(true);
  });
});
