import { describe, expect, it } from "vitest";
import { trechoEstavel } from "./trecho";

/**
 * ⚠ Nenhuma descrição aqui é real. Todas reproduzem a **forma** medida nos
 * arquivos do Davi — largura de coluna, espaçamento, prefixo do banco — com
 * nomes inventados. Mesma regra de `references/formatos-de-extrato.md`: o que
 * o repositório guarda é o formato, nunca o gasto.
 */

const cartao = (d: string) => trechoEstavel(d, "csv_cartao");
const conta = (d: string) => trechoEstavel(d, "csv_conta");

describe("fatura · o local sai, o comerciante fica", () => {
  it("tira o país quando ele tem coluna própria", () => {
    expect(cartao("LOJA DO ZE           BETIM         BRA")).toBe(
      "LOJA DO ZE BETIM",
    );
  });

  it("tira cidade e país quando vêm no mesmo campo", () => {
    expect(cartao("ONIBUS CARTAO 4110  BELO HORIZONT BRA")).toBe(
      "ONIBUS CARTAO 4110",
    );
  });

  it("tira cidade e estado americanos", () => {
    expect(cartao("ACME AI              SAN FRANCISCO CA")).toBe("ACME AI");
  });

  it("não come pedaço do nome que parece código", () => {
    // O caso que a medição pegou. "SUB" tem a mesma cara que "BRA"; o que
    // distingue os dois é a posição, e local só existe no fim. Derrubar um
    // campo só é o que impede de comer `CLOUD SUB`.
    expect(cartao("ACME  CLOUD SUB  SAN FRANCISCO CA")).toBe("ACME CLOUD SUB");
  });

  it("descrição sem local nenhum passa inteira", () => {
    expect(cartao("IOF INTERNACIONAL")).toBe("IOF INTERNACIONAL");
  });

  it("mantém a maquininha junto do comerciante", () => {
    // Uma maquininha aparece na frente de comerciantes que não têm nada a ver
    // entre si. Devolver só ela criaria uma regra que casa com todos.
    expect(cartao("MAQUINETA  CLINICA VETERI BARUERI       BRA")).toBe(
      "MAQUINETA CLINICA VETERI BARUERI",
    );
  });

  it("normaliza acento e caixa", () => {
    expect(cartao("Padaria Céu Azul       SAO PAULO     BRA")).toBe(
      "PADARIA CEU AZUL SAO PAULO",
    );
  });
});

describe("extrato · o conteúdo fica, o tipo do evento sai", () => {
  it("descarta o prefixo do banco", () => {
    // `Aplicacao` sozinho não identifica nada — o que identifica é o produto.
    expect(conta('Aplicacao: "CDB Porq Obj BANCO EXEMPLO SA"')).toBe(
      "CDB PORQ OBJ BANCO EXEMPLO SA",
    );
  });

  it("transferência entre contas não vira regra de texto", () => {
    // O trecho útil aqui é o nome do outro lado, e a regra certa é do tipo
    // `pessoa` (A3). Devolver `CP :00000000-FULANA` amarraria a regra ao
    // número da conta, que muda de banco para banco.
    expect(conta('Pix enviado: "Cp :00000000-Fulana de Tal"')).toBeNull();
    expect(conta('Pix recebido: "Cp :12345678-Empresa Exemplo Ltda"')).toBeNull();
    expect(conta('Pix enviado: "00000 11112222 FULANO SOUZA"')).toBeNull();
  });

  it("descrição sem aspas passa como está", () => {
    expect(conta("Tarifa mensal de pacote")).toBe("TARIFA MENSAL DE PACOTE");
  });
});

describe("quando não há trecho que preste", () => {
  it("recusa o curto demais", () => {
    // Três letras casariam com meio extrato.
    expect(cartao("ABC")).toBeNull();
  });

  it("recusa o que é só número", () => {
    expect(conta('Pix enviado: "00000000000"')).toBeNull();
    expect(cartao("4110 5522")).toBeNull();
  });

  it("recusa vazio e espaço", () => {
    expect(cartao("")).toBeNull();
    expect(conta("     ")).toBeNull();
  });
});
