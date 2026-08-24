import { COBERTURA_CONFIAVEL_PCT } from "@/features/painel/somar-o-mes/cobertura";
import { anoDoMes, nomeDoMes } from "@/lib/mes";

/**
 * Este mês contra os anteriores, por pote (tarefa A3).
 *
 * ## A tela que funciona com um mês e cresce sozinha
 *
 * A medição da spec achou **um** mês fechado no banco. O painel estático que
 * deu origem a este app comparava sete períodos e escrevia "10 meses ainda sem
 * dados" — e construir agora uma tela que espera doze seria reescrever aquela
 * frase em TypeScript.
 *
 * O comparativo entra nascendo com um mês. Quando o Davi subir o segundo
 * extrato, a mesma função passa a comparar sem código novo.
 *
 * ## Mês mal classificado sai da média
 *
 * Um mês metade classificado puxaria a média para baixo, e o app diria "você
 * melhorou" sobre trabalho que faltou fazer. É a mesma régua do degrau 1 do
 * veredito, e vem do mesmo lugar: `coberturaConfiavel`, em `cobertura.ts`.
 */

export type MesNoHistorico = {
  /** `"2026-06"`. */
  mes: string;
  /** `null` quando não saiu dinheiro nenhum naquele mês. */
  coberturaSaiuPct: number | null;
  potes: { poteId: string; totalCentavos: number }[];
};

export type LinhaDoComparativo = {
  poteId: string;
  esteMesCentavos: number;
  mediaCentavos: number;
  /** Este mês menos a média. Negativo quando gastou menos. */
  diferencaCentavos: number;
};

export type Comparativo =
  | {
      pode: false;
      /**
       * ⚠ **Dois motivos, e a diferença entre eles é acionável.**
       *
       * `"primeiro-mes"` manda para o `/upload`: não há o que comparar porque
       * não há outro mês.
       *
       * `"anteriores-descartados"` manda para a `/revisao`: os meses existem,
       * e o que falta é classificação. Dizer "volte quando tiver dois meses"
       * nesse caso seria falso — eles estão lá, e o Davi sabe disso.
       */
      motivo: "primeiro-mes" | "anteriores-descartados";
      /** Quantos meses anteriores existem e ficaram de fora. */
      descartados: number;
    }
  | {
      pode: true;
      mesesNaMedia: number;
      /**
       * Sobre quantos meses a comparação está falando — pronta, e nunca
       * omitida pela tela.
       */
      frase: string;
      linhas: LinhaDoComparativo[];
    };

export function compararMeses(
  historico: MesNoHistorico[],
  mesAtual: string,
): Comparativo {
  const atual = historico.find((m) => m.mes === mesAtual);

  /*
   * Comparação de texto em vez de `Date`: `"2026-06" < "2026-07"` é verdade
   * porque o formato é fixo e zero-preenchido, e é o mesmo motivo pelo qual
   * `mes_referencia` é `YYYY-MM` no banco desde a spec 02.
   */
  const anteriores = historico.filter((m) => m.mes < mesAtual);
  const confiaveis = anteriores.filter(
    (m) =>
      m.coberturaSaiuPct !== null &&
      m.coberturaSaiuPct >= COBERTURA_CONFIAVEL_PCT,
  );

  if (confiaveis.length === 0) {
    return {
      pode: false,
      motivo: anteriores.length === 0 ? "primeiro-mes" : "anteriores-descartados",
      descartados: anteriores.length,
    };
  }

  return {
    pode: true,
    mesesNaMedia: confiaveis.length,
    frase: fraseDaMedia(confiaveis, mesAtual),
    linhas: linhas(atual, confiaveis),
  };
}

/**
 * ⚠ **Com um mês anterior, a palavra "média" não aparece.**
 *
 * É o risco nomeado na spec: com um único mês, "a média dos anteriores" é
 * aquele mês, e chamar isso de média seria a tela dando peso estatístico a uma
 * amostra de um. Aqui ela diz o nome do mês, e quem lê entende o tamanho do que
 * está olhando.
 */
function fraseDaMedia(confiaveis: MesNoHistorico[], mesAtual: string): string {
  if (confiaveis.length === 1) {
    return `comparado com ${nomeDoMes(confiaveis[0].mes, anoDoMes(mesAtual))}`;
  }

  return `média de ${confiaveis.length} meses`;
}

/**
 * ⚠ **A lista de potes não nasce dos dados de um mês só.**
 *
 * Mesma lição da spec 05: derivar a estrutura dos dados quebra quando os dados
 * acabam. Um pote que ficou zerado neste mês sumiria da comparação — e sumir do
 * lugar onde estava é exatamente o que se quer enxergar num comparativo.
 *
 * A lista é a união dos potes de todos os meses considerados, na ordem em que
 * aparecem, e ausente entra com zero.
 */
function linhas(
  atual: MesNoHistorico | undefined,
  confiaveis: MesNoHistorico[],
): LinhaDoComparativo[] {
  const ordem: string[] = [];
  const visto = new Set<string>();

  for (const mes of [...(atual ? [atual] : []), ...confiaveis]) {
    for (const pote of mes.potes) {
      if (visto.has(pote.poteId)) continue;
      visto.add(pote.poteId);
      ordem.push(pote.poteId);
    }
  }

  return ordem.map((poteId) => {
    const esteMesCentavos = totalDoPote(atual, poteId);
    const soma = confiaveis.reduce((t, m) => t + totalDoPote(m, poteId), 0);
    // Centavos são inteiros em todo o projeto; a média não abre exceção.
    const mediaCentavos = Math.round(soma / confiaveis.length);

    return {
      poteId,
      esteMesCentavos,
      mediaCentavos,
      diferencaCentavos: esteMesCentavos - mediaCentavos,
    };
  });
}

function totalDoPote(mes: MesNoHistorico | undefined, poteId: string): number {
  return mes?.potes.find((p) => p.poteId === poteId)?.totalCentavos ?? 0;
}
