import { anoDoMes } from "@/lib/mes";
import { mesesDoAno } from "./anoDoComparativo";
import {
  mediaDoComparativo,
  type MediaDoComparativo,
  type MesComCobertura,
} from "./comparativo";

/**
 * A frase do painel: "comparado com a média de 3 meses" (spec 12, C1).
 *
 * ## Painel e `/comparativo` recortam igual
 *
 * As duas telas compartilham `mediaDoComparativo` desde a spec 09 justamente
 * para não poderem divergir: se a frase do painel e a da `/comparativo` fossem
 * calculadas em lugares diferentes, um dia o painel diria "média de 3 meses" e
 * a tela ao lado diria "comparado com maio", e quem lesse não teria como saber
 * qual das duas mentiu.
 *
 * A `/comparativo` recorta o histórico pelo ano antes de comparar; recortar só
 * de um lado reintroduziria exatamente essa divergência. Por isso a composição
 * "recortar pelo ano do mês de referência, depois tirar a média" mora aqui, num
 * lugar só, com teste — e não solta na rota.
 *
 * ⚠ **Recebe `cobertura`, a consulta barata.** Não volte a alimentar esta
 * função com `historicoDosMeses` na página do painel.
 *
 * ⚠ **Na virada do ano, os meses do ano anterior não entram.** Em janeiro a
 * frase é do tipo "primeiro mês", mesmo que dezembro exista na conta.
 */
export function mediaDoPainel(
  cobertura: MesComCobertura[],
  mesReferencia: string,
): MediaDoComparativo {
  return mediaDoComparativo(
    mesesDoAno(cobertura, anoDoMes(mesReferencia)),
    mesReferencia,
  );
}
