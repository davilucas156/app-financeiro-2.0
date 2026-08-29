import { describe, expect, it } from "vitest";
import { linhasDePotes } from "@/features/onboarding/concluir-onboarding/seed";
import {
  estadoDoPote,
  legendaDoPote,
} from "@/features/painel/painel-do-mes/poteNoPainel";
import { metaDoPote } from "@/features/painel/somar-o-mes/meta";
import { METAS_DO_PADRAO } from "./metasDoPadrao";
import { lerPercentual } from "./percentual";

/**
 * O que a spec 13 promete, ponta a ponta (tarefa E1).
 *
 * ⚠ **É o teste que responde "a spec funciona?".** Cada fase provou a sua peça;
 * este liga o campo de texto ao veredito do painel, que são as duas pontas que
 * a pessoa vê:
 *
 * 1. o que ela digita vira percentual;
 * 2. o percentual vira meta em centavos, sobre a renda declarada;
 * 3. a meta vira estado — e é o estado que pinta a barra.
 *
 * Nenhum passo passa perto do banco, e é por isso que ele cabe no Vitest: a
 * única coisa que o banco faz no meio é guardar o número.
 */

/** A renda de referência do painel original — a mesma do `CampoDeRenda`. */
const RENDA = 120_000;

function comoOPainelVe(texto: string, gastoCentavos: number) {
  const lido = lerPercentual(texto);
  if (!lido.ok) throw new Error(`recusou "${texto}": ${lido.mensagem}`);

  const pote = {
    percentual: lido.percentual,
    rendaDeclaradaCentavos: RENDA,
    totalCentavos: gastoCentavos,
    lancamentos: 1,
  };

  const meta = metaDoPote(pote);

  return {
    meta,
    estado: estadoDoPote(pote, meta.metaCentavos),
  };
}

describe("o que se digita chega ao veredito do painel", () => {
  it("30% de R$ 1.200 é uma meta de R$ 360", () => {
    const { meta } = comoOPainelVe("30", 30_000);

    expect(meta.metaCentavos).toBe(36_000);
  });

  /*
   * ⚠ **A promessa central da spec, em duas linhas**: o mesmo gasto, julgado
   * por dois rateios diferentes, dá vereditos diferentes — e nada foi
   * importado no meio.
   */
  it("apertar a meta faz o mesmo gasto passar a estourar", () => {
    const gasto = 30_000;

    expect(comoOPainelVe("30", gasto).estado).toBe("normal");
    expect(comoOPainelVe("20", gasto).estado).toBe("estourado");
  });

  /*
   * ⚠ **A Descoberta 5 atravessando as quatro fases.** No campo, `""` e `"0"`
   * são dois caracteres de diferença; no painel, são a diferença entre um pote
   * que ninguém julga e um que estoura com qualquer gasto.
   */
  it("vazio e zero produzem estados diferentes", () => {
    expect(comoOPainelVe("", 30_000).estado).toBe("sem-meta");
    expect(comoOPainelVe("0", 30_000).estado).toBe("estourado");
  });

  it("sem meta não desenha barra; com meta, desenha", () => {
    expect(comoOPainelVe("", 30_000).meta.fracao).toBeNull();
    expect(comoOPainelVe("30", 18_000).meta.fracao).toBe(0.5);
  });

  /*
   * O risco 7 da spec: a observação do pote não pode sobreviver à meta. Quem
   * deu 10% a Manutenção não quer continuar lendo "eventual" no lugar do
   * número.
   */
  it("a observação some quando o pote ganha meta", () => {
    const { meta, estado } = comoOPainelVe("10", 6_000);

    expect(
      legendaDoPote(
        estado,
        { observacao: "eventual", tipo: "gasto" },
        meta.fracao,
      ),
    ).toBe("50% da meta");
  });
});

describe("voltar ao padrão devolve o que o onboarding daria", () => {
  /*
   * ⚠ **Duas derivações independentes da mesma semente.**
   *
   * `METAS_DO_PADRAO` sai de `POTES_DE_GASTO`; `linhasDePotes` é o que o
   * onboarding grava. Se as duas divergirem, "voltar ao padrão" passa a
   * restaurar um padrão que não é o do app — e faria isso em silêncio, porque
   * o botão continuaria funcionando.
   */
  it("percentual por percentual, bate com o que o seed grava", () => {
    const doSeed = new Map(
      linhasDePotes("usuario-de-teste")
        .filter((linha) => linha.tipo === "gasto")
        .map((linha) => [linha.slug, linha.percentualMeta ?? null]),
    );

    expect(METAS_DO_PADRAO.length).toBe(doSeed.size);

    for (const meta of METAS_DO_PADRAO) {
      expect(doSeed.get(meta.slug)).toBe(meta.percentual);
    }
  });

  it("os dois potes de fora do rateio voltam a não ter meta", () => {
    const semMeta = METAS_DO_PADRAO.filter((m) => m.percentual === null);

    expect(semMeta.map((m) => m.slug).sort()).toEqual([
      "manutencao",
      "outros-repasses",
    ]);
  });

  it("o que sobra soma 100", () => {
    const soma = METAS_DO_PADRAO.reduce((t, m) => t + (m.percentual ?? 0), 0);

    expect(soma).toBe(100);
  });
});
