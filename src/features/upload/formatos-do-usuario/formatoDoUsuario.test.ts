import { describe, expect, it } from "vitest";
import { comoFormato, validarMapeamento } from "./formatoDoUsuario";

/**
 * A fronteira entre o cliente e a tabela (spec 11, tarefa C2).
 *
 * ⚠ **Uma server action é um endpoint HTTP.** Todo teste aqui descreve alguém
 * chamando a action por fora, com o que quiser — que é o que o tipo do
 * TypeScript não impede.
 */

const CABECALHO = ["Fecha_Mov", "Historico", "Vlr", "Saldo"];

const COMPLETO = {
  nome: "Extrato do Banco Exemplo",
  banco: "Banco Exemplo",
  dialeto: { separador: ";", aspas: false },
  colunas: { data: 0, descricao: 1, valor: 2, saldo: 3 },
  formatoData: "dd/mm/aaaa",
  formatoNumero: "pt-BR",
  origem: "csv_conta",
  sinalNegativo: "saida",
};

describe("o caminho feliz", () => {
  it("aceita um mapeamento completo", () => {
    const r = validarMapeamento(COMPLETO, CABECALHO);

    expect(r.ok).toBe(true);
  });

  /*
   * ⚠ **A decisão que mudou o desenho da spec.** A tela trabalha com índices; o
   * banco guarda nomes, porque é por nome que a `reconhecer` casa cabeçalho.
   * Guardar índice quebraria em silêncio no dia em que o banco acrescentasse
   * uma coluna à esquerda.
   */
  it("traduz índice apontado na tela para nome de coluna", () => {
    const r = validarMapeamento(COMPLETO, CABECALHO);

    expect(r.ok && r.mapeamento.colunas).toEqual({
      data: "Fecha_Mov",
      descricao: "Historico",
      valor: "Vlr",
      saldo: "Saldo",
    });
  });
});

describe("o que ele recusa", () => {
  it("nomeia a coluna que falta, e não diz 'preencha os campos'", () => {
    const r = validarMapeamento(
      { ...COMPLETO, colunas: { data: 0, descricao: 1 } },
      CABECALHO,
    );

    expect(r.ok).toBe(false);
    expect(!r.ok && r.erro).toContain("valor");
  });

  it("recusa separador que não está na lista", () => {
    const r = validarMapeamento(
      { ...COMPLETO, dialeto: { separador: "abc", aspas: false } },
      CABECALHO,
    );

    expect(r.ok).toBe(false);
  });

  it("recusa formato sem nome e sem banco", () => {
    expect(validarMapeamento({ ...COMPLETO, nome: "  " }, CABECALHO).ok).toBe(
      false,
    );
    expect(validarMapeamento({ ...COMPLETO, banco: "" }, CABECALHO).ok).toBe(
      false,
    );
  });

  it("recusa o que nem é objeto", () => {
    expect(validarMapeamento(null, CABECALHO).ok).toBe(false);
    expect(validarMapeamento("<script>", CABECALHO).ok).toBe(false);
  });

  /*
   * ⚠ Coluna apontada para uma célula vazia do cabeçalho não vira formato: por
   * nome ela nunca casaria depois. Reclamar ao salvar é melhor que salvar um
   * formato que nunca reconhece nada.
   */
  it("recusa coluna obrigatória apontada para cabeçalho vazio", () => {
    const r = validarMapeamento(COMPLETO, ["Fecha_Mov", "Historico", "  "]);

    expect(r.ok).toBe(false);
    expect(!r.ok && r.erro).toContain("valor");
  });

  it("recusa índice fora do cabeçalho", () => {
    const r = validarMapeamento(
      { ...COMPLETO, colunas: { ...COMPLETO.colunas, valor: 99 } },
      CABECALHO,
    );

    expect(r.ok).toBe(false);
  });
});

describe("o que ele corrige em silêncio, e por quê", () => {
  /*
   * ⚠ Papel desconhecido não muda o que o formato lê: as três obrigatórias são
   * conferidas do mesmo jeito. Travar a pessoa por uma chave invisível para ela
   * seria pior que ignorá-la.
   */
  it("descarta papel que não existe, sem recusar o resto", () => {
    const r = validarMapeamento(
      { ...COMPLETO, colunas: { ...COMPLETO.colunas, inventado: 0 } },
      CABECALHO,
    );

    expect(r.ok).toBe(true);
    expect(r.ok && "inventado" in r.mapeamento.colunas).toBe(false);
  });

  it("valor estranho em origem e sinal cai no padrão, nunca na coluna", () => {
    const r = validarMapeamento(
      { ...COMPLETO, origem: "<script>", sinalNegativo: "drop table" },
      CABECALHO,
    );

    expect(r.ok && r.mapeamento.origem).toBe("csv_conta");
    expect(r.ok && r.mapeamento.sinalNegativo).toBe("saida");
  });

  it("formato de data e de número estranhos caem no padrão", () => {
    const r = validarMapeamento(
      { ...COMPLETO, formatoData: "qualquer", formatoNumero: "de-DE" },
      CABECALHO,
    );

    expect(r.ok && r.mapeamento.formatoData).toBe("dd/mm/aaaa");
    expect(r.ok && r.mapeamento.formatoNumero).toBe("pt-BR");
  });
});

describe("o formato salvo virando o que o leitor entende", () => {
  /*
   * ⚠ Depois daqui nada no leitor sabe se o formato veio do código ou de
   * alguém: é o que permite `reconhecer` ter um caminho só.
   */
  it("sai um Formato comum, sem marca de origem", () => {
    const r = validarMapeamento(COMPLETO, CABECALHO);
    if (!r.ok) throw new Error("o mapeamento devia ser válido");

    const f = comoFormato("abc-123", r.mapeamento);

    expect(f.id).toBe("abc-123");
    expect(f.colunas).toEqual({
      data: "Fecha_Mov",
      descricao: "Historico",
      valor: "Vlr",
      saldo: "Saldo",
    });
    expect(f.obrigatorias).toEqual(["data", "descricao", "valor"]);
    // Pendência 8: nasce vazio, e o par que se anula cobre o caso comum.
    expect(f.padroesDePassagem).toEqual([]);
  });
});
