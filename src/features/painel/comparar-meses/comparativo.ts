import { COBERTURA_CONFIAVEL_PCT } from "@/features/painel/somar-o-mes/cobertura";
import { anoDoMes, nomeDoMes } from "@/lib/mes";

/**
 * O comparativo entre meses, por pote (tarefa A3).
 *
 * ## Revisado depois de reler o `planejamento_anual_davi.html`
 *
 * A primeira versão desta função devolvia só "este mês contra a média dos
 * anteriores". Relendo o painel estático para responder a uma pergunta do Davi,
 * apareceu que o Comparativo Anual dele mostra **uma barra por período, para
 * cada pote** — Dez/Jan/Fev, Mar, Abr, Mai, Jun, Jul, lado a lado — e não só um
 * número contra uma média.
 *
 * A média sozinha responde "este mês foi acima ou abaixo do normal?". A série
 * responde "o que está acontecendo com este pote ao longo do ano?", que é a
 * pergunta que fez ele montar aquela tela à mão todo mês. São perguntas
 * diferentes, e a segunda é a que dá nome à funcionalidade.
 *
 * Por isso `linhas` sai **sempre**, com a série inteira, e `media` é um campo
 * separado que pode dizer que ainda não dá.
 *
 * ## A tela que funciona com um mês e cresce sozinha
 *
 * A medição da spec achou **um** mês fechado no banco. Com um mês, a série tem
 * uma barra por pote e a média se cala — exatamente como o painel estático, que
 * anunciava "6 períodos com dados · 5 a preencher" sem esconder nada.
 *
 * ## Mês mal classificado não some: fica marcado
 *
 * Ele sai da **média**, porque um mês metade classificado a puxaria para baixo
 * e o app diria "você melhorou" sobre trabalho que faltou fazer. Mas continua
 * na **série**, com `confiavel: false`: some da média quem não pode servir de
 * régua; some da tela quem não existe, e esse mês existe.
 */

export type MesNoHistorico = {
  /** `"2026-06"`. */
  mes: string;
  /** `null` quando não saiu dinheiro nenhum naquele mês. */
  coberturaSaiuPct: number | null;
  potes: { poteId: string; totalCentavos: number }[];
};

export type ValorNoMes = {
  mes: string;
  totalCentavos: number;
  /** A barra é desenhada de qualquer jeito; `false` manda desenhá-la apagada. */
  confiavel: boolean;
};

export type LinhaDoComparativo = {
  poteId: string;
  esteMesCentavos: number;
  /** `null` enquanto não houver mês anterior que sirva de régua. */
  mediaCentavos: number | null;
  /** Este mês menos a média. Negativo quando gastou menos. */
  diferencaCentavos: number | null;
  /** Do mais antigo ao mais novo, incluindo o mês atual. */
  serie: ValorNoMes[];
};

export type MediaDoComparativo =
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
      /** Quantos meses anteriores existem e ficaram de fora da média. */
      descartados: number;
    }
  | {
      pode: true;
      mesesNaMedia: number;
      /**
       * Sobre quantos meses a média está falando — pronta, e nunca omitida
       * pela tela.
       */
      frase: string;
    };

export type Comparativo = {
  /** Um por pote. Sempre presente, mesmo com um mês só. */
  linhas: LinhaDoComparativo[];
  media: MediaDoComparativo;
};

export function compararMeses(
  historico: MesNoHistorico[],
  mesAtual: string,
): Comparativo {
  /*
   * Comparação de texto em vez de `Date`: `"2026-06" < "2026-07"` é verdade
   * porque o formato é fixo e zero-preenchido, e é o mesmo motivo pelo qual
   * `mes_referencia` é `YYYY-MM` no banco desde a spec 02.
   *
   * ⚠ **Mês posterior ao escolhido fica de fora da série inteira.** O painel
   * deixa escolher o mês; olhando maio, junho ainda não aconteceu.
   */
  const ate = historico
    .filter((m) => m.mes <= mesAtual)
    .sort((a, b) => a.mes.localeCompare(b.mes));

  const atual = ate.find((m) => m.mes === mesAtual);
  const anteriores = ate.filter((m) => m.mes < mesAtual);
  const confiaveis = anteriores.filter(confiavel);

  return {
    linhas: linhas(ate, atual, confiaveis),
    media:
      confiaveis.length === 0
        ? {
            pode: false,
            motivo:
              anteriores.length === 0 ? "primeiro-mes" : "anteriores-descartados",
            descartados: anteriores.length,
          }
        : {
            pode: true,
            mesesNaMedia: confiaveis.length,
            frase: fraseDaMedia(confiaveis, mesAtual),
          },
  };
}

function confiavel(mes: MesNoHistorico): boolean {
  return (
    mes.coberturaSaiuPct !== null &&
    mes.coberturaSaiuPct >= COBERTURA_CONFIAVEL_PCT
  );
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
 * Mesma lição da B5 da spec 05: derivar a estrutura dos dados quebra quando os
 * dados acabam. Um pote que ficou zerado neste mês sumiria da comparação — e
 * sumir do lugar onde estava é exatamente o que se quer enxergar aqui.
 *
 * A lista é a união dos potes de todos os meses, começando pelo mês atual para
 * a ordem da tela ser a ordem do painel, e ausente entra com zero.
 */
function linhas(
  ate: MesNoHistorico[],
  atual: MesNoHistorico | undefined,
  confiaveis: MesNoHistorico[],
): LinhaDoComparativo[] {
  const ordem: string[] = [];
  const visto = new Set<string>();

  for (const mes of [...(atual ? [atual] : []), ...ate]) {
    for (const pote of mes.potes) {
      if (visto.has(pote.poteId)) continue;
      visto.add(pote.poteId);
      ordem.push(pote.poteId);
    }
  }

  return ordem.map((poteId) => {
    const esteMesCentavos = totalDoPote(atual, poteId);

    const mediaCentavos =
      confiaveis.length === 0
        ? null
        : // Centavos são inteiros em todo o projeto; a média não abre exceção.
          Math.round(
            confiaveis.reduce((t, m) => t + totalDoPote(m, poteId), 0) /
              confiaveis.length,
          );

    return {
      poteId,
      esteMesCentavos,
      mediaCentavos,
      diferencaCentavos:
        mediaCentavos === null ? null : esteMesCentavos - mediaCentavos,
      serie: ate.map((m) => ({
        mes: m.mes,
        totalCentavos: totalDoPote(m, poteId),
        confiavel: confiavel(m),
      })),
    };
  });
}

function totalDoPote(mes: MesNoHistorico | undefined, poteId: string): number {
  return mes?.potes.find((p) => p.poteId === poteId)?.totalCentavos ?? 0;
}
