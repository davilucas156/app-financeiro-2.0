import { describe, expect, it } from "vitest";
import { prepararLancamentos } from "@/features/upload/ler-arquivo/preparar";
import type { Lancamento } from "@/features/upload/ler-arquivo/lancamentos";
import {
  classificarImportacao,
  VALOR_ALTO_CENTAVOS,
  type RegraAplicavel,
} from "./classificarImportacao";

/** ⚠ Nenhum nome real: as formas medidas, com comerciantes inventados. */

const lanc = (p: Partial<Lancamento> = {}): Lancamento => ({
  data: "2026-06-18",
  descricao: "PADARIA DO ZE          BETIM         BRA",
  valorCentavos: 1500,
  direcao: "saida",
  parcela: null,
  categoriaDoBanco: null,
  linha: 1,
  ...p,
});

const preparar = (lancamentos: Lancamento[]) =>
  prepararLancamentos([{ origem: "csv_cartao", lancamentos }]);

const REGRA_PADARIA: RegraAplicavel = {
  id: "r-padaria",
  chave: "descricao_contem:PADARIA",
  criterio: { tipo: "descricao_contem", termo: "PADARIA" },
  categoriaId: "cat-alimentacao",
  prioridade: 30,
};

describe("quando uma regra bate", () => {
  const [p] = preparar([lanc()]);
  const { porImpressao, classificados, pendentes } = classificarImportacao(
    [p],
    [REGRA_PADARIA],
  );
  const d = porImpressao.get(p.impressao)!;

  it("nasce classificado", () => {
    expect(d.categoriaId).toBe("cat-alimentacao");
    expect(classificados).toBe(1);
    expect(pendentes).toBe(0);
  });

  it("guarda de onde veio", () => {
    expect(d.classificadoPor).toBe("regra");
    expect(d.regraId).toBe("r-padaria");
  });

  it("congela o texto que a regra procurava", () => {
    // É o que faz "por que isso caiu em Lazer?" continuar tendo resposta
    // depois que a regra for apagada (C3).
    expect(d.regraChave).toBe("descricao_contem:PADARIA");
  });
});

describe("quando nenhuma regra bate", () => {
  const [p] = preparar([lanc({ descricao: "LOJA NOVA   BETIM   BRA" })]);
  const { porImpressao, classificados, pendentes } = classificarImportacao(
    [p],
    [REGRA_PADARIA],
  );

  it("nasce pendente, sem procedência nenhuma", () => {
    const d = porImpressao.get(p.impressao)!;
    expect(d.categoriaId).toBeNull();
    expect(d.classificadoPor).toBeNull();
    expect(d.regraChave).toBeNull();
    expect(d.status).toBe("importado");
  });

  it("não é erro: é o mês normal de quem começou ontem", () => {
    expect(classificados).toBe(0);
    expect(pendentes).toBe(1);
    expect(classificarImportacao([p], []).pendentes).toBe(1);
  });
});

describe("valor alto passa pela sua vista mesmo tendo batido", () => {
  it("a categoria fica gravada — a regra bateu de verdade", () => {
    const [p] = preparar([lanc({ valorCentavos: VALOR_ALTO_CENTAVOS })]);
    const r = classificarImportacao([p], [REGRA_PADARIA]);
    const d = r.porImpressao.get(p.impressao)!;

    expect(d.categoriaId).toBe("cat-alimentacao");
    expect(d.status).toBe("revisao_pendente");
    expect(d.motivo).toContain("valor alto");
    // Continua contando como classificado: ele **foi** classificado.
    expect(r.classificados).toBe(1);
    expect(r.pendentes).toBe(0);
    expect(r.conferir).toBe(1);
  });

  it("o limiar é inclusivo — 'R$ 200 ou mais' é como se fala", () => {
    const abaixo = preparar([lanc({ valorCentavos: VALOR_ALTO_CENTAVOS - 1 })]);
    expect(classificarImportacao(abaixo, [REGRA_PADARIA]).conferir).toBe(0);
  });

  it("valor alto **sem** regra não vira marcação: já está pendente", () => {
    const [p] = preparar([
      lanc({ descricao: "LOJA NOVA  BETIM  BRA", valorCentavos: 50000 }),
    ]);
    const r = classificarImportacao([p], [REGRA_PADARIA]);

    expect(r.conferir).toBe(0);
    expect(r.porImpressao.get(p.impressao)!.status).toBe("importado");
  });
});

describe("o motor não toca no que a spec 02 já resolveu", () => {
  it("pagamento de fatura fica excluído e sem categoria", () => {
    const preparados = preparar([
      lanc({ descricao: "PAGAMENTO ON LINE", valorCentavos: 31819 }),
    ]);
    const r = classificarImportacao(preparados, [
      { ...REGRA_PADARIA, criterio: { tipo: "descricao_contem", termo: "PAGAMENTO" } },
    ]);
    const d = r.porImpressao.get(preparados[0].impressao)!;

    expect(d.status).toBe("excluido");
    expect(d.categoriaId).toBeNull();
    expect(r.classificados).toBe(0);
    // Nem classificado nem pendente: já foi resolvido antes do motor. É o
    // mesmo recorte da medição da A6, e é o que permite comparar os números.
    expect(r.pendentes).toBe(0);
  });

  it("par que se anula fica em revisão, com o motivo da spec 02", () => {
    const preparados = prepararLancamentos([
      {
        origem: "csv_conta",
        lancamentos: [
          lanc({ descricao: "ALGO", valorCentavos: 6000, direcao: "saida" }),
          lanc({ descricao: "ALGO", valorCentavos: 6000, direcao: "entrada" }),
        ],
      },
    ]);

    const r = classificarImportacao(preparados, []);

    for (const p of preparados) {
      const d = r.porImpressao.get(p.impressao)!;
      expect(d.status).toBe("revisao_pendente");
      expect(d.motivo).toContain("par que se anula");
      expect(d.categoriaId).toBeNull();
    }
  });
});

describe("todo lançamento recebe uma decisão", () => {
  it("nenhum fica de fora do mapa", () => {
    // O serviço faz `get(impressao)!` e grava. Um lançamento sem decisão
    // viraria um `undefined` silencioso no meio do insert.
    const preparados = preparar([
      lanc({ descricao: "PADARIA DO ZE  BETIM  BRA" }),
      lanc({ descricao: "LOJA NOVA  BETIM  BRA" }),
      lanc({ descricao: "PAGAMENTO ON LINE" }),
    ]);

    const r = classificarImportacao(preparados, [REGRA_PADARIA]);

    expect(r.porImpressao.size).toBe(preparados.length);
    for (const p of preparados) {
      expect(r.porImpressao.has(p.impressao), p.descricao).toBe(true);
    }
  });
});
