import type { Cobertura } from "@/features/painel/somar-o-mes/cobertura";
import { metaDoPote } from "@/features/painel/somar-o-mes/meta";
import {
  vereditoDoMes,
  type Veredito,
} from "@/features/painel/veredito-do-mes/veredito";
import type { PoteNoPainel } from "./poteNoPainel";

/**
 * A montagem do input do veredito a partir do que a tela do painel já tem.
 *
 * Fica num `.ts` porque o `TelaDoPainel` é `.tsx` e o Vitest só olha `.ts`: a
 * regra de quais potes entram (só os de gasto) e de qual meta cada um recebe
 * vale teste, não só a frase que sai dela.
 */
export function vereditoDoPainel({
  cobertura,
  rendaCentavos,
  saiuCentavos,
  potes,
}: {
  cobertura: Cobertura;
  /** `null` enquanto o Davi não informar a renda. */
  rendaCentavos: number | null;
  saiuCentavos: number;
  /** Os potes do painel. Os de renda são ignorados aqui. */
  potes: PoteNoPainel[];
}): Veredito | null {
  return vereditoDoMes({
    cobertura,
    rendaDeclaradaCentavos: rendaCentavos,
    saiuCentavos,
    potes: potes
      .filter((p) => p.tipo === "gasto")
      .map((pote) => ({
        nome: pote.nome,
        emoji: pote.emoji,
        totalCentavos: pote.totalCentavos,
        lancamentos: pote.lancamentos,
        metaCentavos: metaDoPote({
          percentual: pote.percentual,
          rendaDeclaradaCentavos: rendaCentavos,
          totalCentavos: pote.totalCentavos,
          lancamentos: pote.lancamentos,
        }).metaCentavos,
      })),
  });
}
