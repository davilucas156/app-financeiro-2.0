import { describe, expect, it } from "vitest";
import { casarRegra } from "./regras";
import { pessoaDe } from "./pessoa";

/**
 * ⚠ Nenhum nome aqui é real. Todos reproduzem a **forma** medida no extrato do
 * Davi — prefixo do evento, aspas, `Cp :` e número — com nomes inventados.
 */

describe("as duas formas que o banco usa", () => {
  it("chave e número antes do nome", () => {
    expect(pessoaDe('Pix enviado: "Cp :00000000-Fulana de Tal"')).toBe(
      "Fulana de Tal",
    );
  });

  it("banco, agência e conta antes do nome", () => {
    expect(
      pessoaDe('Transferencia enviada: "999 0000 1234567 Fulana de Tal"'),
    ).toBe("Fulana de Tal");

    expect(pessoaDe('Pix enviado: "00000 11112222 FULANO SOUZA"')).toBe(
      "FULANO SOUZA",
    );
  });

  it("não depende do tipo do evento", () => {
    // Bancos inventam nomes de evento — "Pix recebido devolvido" é um deles.
    // Gatear por uma lista de eventos conhecidos quebraria no próximo nome
    // novo; a forma do conteúdo é o que identifica.
    expect(pessoaDe('Evento que eu nunca vi: "Cp :123-Fulana de Tal"')).toBe(
      "Fulana de Tal",
    );
  });
});

describe("o que não é transferência", () => {
  it("pagamento de fatura", () => {
    expect(
      pessoaDe('Pagamento efetuado: "Pagamento fatura cartao Banco"'),
    ).toBeNull();
  });

  it("aplicação em investimento", () => {
    expect(pessoaDe('Aplicacao: "CDB Porq Obj BANCO EXEMPLO SA"')).toBeNull();
  });

  it("um grupo de dígitos só não basta", () => {
    // Com um só, qualquer descrição que comece com número viraria uma
    // contraparte inventada.
    expect(pessoaDe('Evento: "4110 alguma coisa"')).toBeNull();
  });
});

describe("os buracos do próprio banco", () => {
  it('devolve nada quando o banco escreve "null"', () => {
    // Não é bug meu: o banco grava a palavra `null` quando não sabe o nome da
    // contraparte. Medido num Pix devolvido.
    expect(pessoaDe('Pix recebido devolvido: "Cp :10000001-null"')).toBeNull();
  });

  it("devolve nada quando sobra só número", () => {
    expect(pessoaDe('Pix enviado: "Cp :123-00000000000"')).toBeNull();
  });

  it("devolve nada quando o nome é curto demais", () => {
    expect(pessoaDe('Pix enviado: "Cp :123-AB"')).toBeNull();
  });
});

describe("por que o nome, e não o número da conta", () => {
  it("a mesma contraparte com números diferentes vira a mesma regra", () => {
    // Medido: a mesma contraparte apareceu no mesmo mês com dois números de
    // conta diferentes e duas grafias. Regra amarrada ao número teria falhado
    // na segunda vez.
    const primeira = pessoaDe(
      'Pix recebido: "Cp :10000002-Empresa Exemplo Ltda"',
    );
    const segunda = pessoaDe(
      'Pix recebido: "Cp :10000003-EMPRESA EXEMPLO LTDA"',
    );

    expect(primeira).toBe("Empresa Exemplo Ltda");
    expect(segunda).toBe("EMPRESA EXEMPLO LTDA");

    // Grafias diferentes, mas a A1 casa as duas com a mesma regra.
    const regra = {
      id: "r1",
      criterio: { tipo: "pessoa", nome: "empresa exemplo ltda" } as const,
      categoriaId: "cat",
      prioridade: 50,
    };

    const alvo = (pessoa: string | null) => ({
      descricao: "irrelevante",
      valorCentavos: 1000,
      direcao: "entrada" as const,
      pessoa,
    });

    expect(casarRegra([regra], alvo(primeira))?.id).toBe("r1");
    expect(casarRegra([regra], alvo(segunda))?.id).toBe("r1");
  });

  it("preserva a grafia para a tela poder mostrar", () => {
    // Quem normaliza para comparar é a A1. Aqui o nome sai como está escrito,
    // para a pergunta "criar regra para Fulana de Tal?" não sair gritando.
    expect(pessoaDe('Pix enviado: "Cp :123-Fulana de Tal"')).toBe(
      "Fulana de Tal",
    );
  });

  it("arruma só o espaço sobrando", () => {
    expect(pessoaDe('Pix enviado: "Cp :123-Fulana    de   Tal"')).toBe(
      "Fulana de Tal",
    );
  });
});
