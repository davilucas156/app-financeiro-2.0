import { describe, expect, it } from "vitest";
import { EXTRATO_INTER, FATURA_INTER } from "./amostras";
import { decodificar } from "./grade";
import { palpitar } from "./palpite";

/**
 * O palpite do mapeamento (spec 11, tarefa A4).
 *
 * ⚠ **O teste que vale é o primeiro bloco.** Os dois arquivos do Inter são os
 * únicos formatos **reais medidos** que o projeto tem, e eles se excluem: um
 * exige tratamento de aspas e o outro exige o contrário; um usa `;` e o outro
 * `,`; um tem saldo e o outro tem parcelamento; e os dois usam o sinal com
 * significados **opostos**.
 *
 * Acertar os dois no escuro — sem olhar `FORMATOS`, que é onde as respostas
 * estão escritas — é a melhor evidência disponível de que o palpite serve para
 * um terceiro banco.
 */

describe("acerta os dois arquivos reais medidos, sem consultar FORMATOS", () => {
  it("o extrato de conta do Inter", () => {
    const p = palpitar(decodificar(new TextEncoder().encode(EXTRATO_INTER)));

    expect(p).not.toBeNull();
    expect(p!.dialeto).toEqual({ separador: ";", aspas: false });
    // 5 linhas de metadados antes (4 + 1 em branco).
    expect(p!.linhaCabecalho).toBe(5);
    expect(p!.colunas.data).toBe(0);
    expect(p!.colunas.descricao).toBe(1);
    expect(p!.colunas.valor).toBe(2);
    expect(p!.colunas.saldo).toBe(3);
    expect(p!.formatoData).toBe("dd/mm/aaaa");
    expect(p!.formatoNumero).toBe("pt-BR");
    expect(p!.origem).toBe("csv_conta");
    expect(p!.sinalNegativo).toBe("saida");
  });

  it("a fatura do cartão do Inter", () => {
    const p = palpitar(decodificar(new TextEncoder().encode(FATURA_INTER)));

    expect(p).not.toBeNull();
    expect(p!.dialeto).toEqual({ separador: ",", aspas: true });
    expect(p!.linhaCabecalho).toBe(0);
    expect(p!.colunas.data).toBe(0);
    expect(p!.colunas.descricao).toBe(1);
    expect(p!.colunas.valor).toBe(4);
    expect(p!.colunas.saldo).toBeUndefined();
    expect(p!.formatoData).toBe("dd/mm/aaaa");
    expect(p!.formatoNumero).toBe("pt-BR");
    expect(p!.origem).toBe("csv_cartao");
    expect(p!.sinalNegativo).toBe("entrada");
  });

  /*
   * ⚠ **O caso difícil, dito em voz alta.** Os dois arquivos usam o sinal com
   * significados opostos — no extrato `-318,19` é dinheiro que saiu, na fatura
   * uma compra positiva de R$ 15,00 é gasto. Um palpite que acertasse os dois
   * por sorte acertaria os dois iguais.
   */
  it("propõe sinais opostos para os dois, que é o que eles são", () => {
    const extrato = palpitar(
      decodificar(new TextEncoder().encode(EXTRATO_INTER)),
    );
    const fatura = palpitar(
      decodificar(new TextEncoder().encode(FATURA_INTER)),
    );

    expect(extrato!.sinalNegativo).not.toBe(fatura!.sinalNegativo);
  });
});

describe("um banco que não existe, em outro dialeto", () => {
  /** `,` sem aspas, data ISO, número en-US, sem saldo, sem parcelamento. */
  const OUTRO_BANCO = `Movimento,Historico,Vlr
2026-03-04,COMPRA MERCADO CENTRAL,-152.40
2026-03-05,TRANSFERENCIA RECEBIDA,1200.00
2026-03-11,ASSINATURA MENSAL,-39.90
`;

  it("lê o dialeto, a data e o número que não são os do Inter", () => {
    const p = palpitar(OUTRO_BANCO);

    expect(p).not.toBeNull();
    expect(p!.dialeto).toEqual({ separador: ",", aspas: false });
    expect(p!.linhaCabecalho).toBe(0);
    expect(p!.colunas.data).toBe(0);
    expect(p!.colunas.descricao).toBe(1);
    expect(p!.colunas.valor).toBe(2);
    expect(p!.formatoData).toBe("aaaa-mm-dd");
    expect(p!.formatoNumero).toBe("en-US");
  });

  it("sem saldo e sem parcelamento, propõe conta e não cartão", () => {
    expect(palpitar(OUTRO_BANCO)!.origem).toBe("csv_conta");
  });
});

describe("o que ele recusa", () => {
  it("devolve null para texto que não é tabela", () => {
    expect(palpitar("uma linha solta sem separador nenhum")).toBeNull();
  });

  it("devolve null para arquivo vazio", () => {
    expect(palpitar("")).toBeNull();
  });

  it("devolve null quando há cabeçalho mas nenhuma linha de dado", () => {
    expect(palpitar("Data;Descrição;Valor\n")).toBeNull();
  });
});

describe("a data ambígua", () => {
  /*
   * ⚠ Todo dia ≤ 12: `dd/mm` e `mm/dd` leem o arquivo inteiro, e as duas
   * leituras são plausíveis. O palpite escolhe a convenção do país — a defesa é
   * a prévia mostrar as datas lidas, não um palpite mais esperto.
   */
  it("propõe dd/mm quando as duas leituras servem", () => {
    const p = palpitar(`Data;Descrição;Valor
01/02/2026;COMPRA A;-10,00
03/04/2026;COMPRA B;-20,00
`);

    expect(p!.formatoData).toBe("dd/mm/aaaa");
  });

  /*
   * `25` não é mês. Aqui o arquivo desempata sozinho, e é o único caso em que
   * ele desempata.
   */
  it("propõe mm/dd quando é a única leitura que serve", () => {
    const p = palpitar(`Data;Descrição;Valor
12/25/2026;COMPRA A;-10,00
01/13/2026;COMPRA B;-20,00
`);

    expect(p!.formatoData).toBe("mm/dd/aaaa");
  });
});
