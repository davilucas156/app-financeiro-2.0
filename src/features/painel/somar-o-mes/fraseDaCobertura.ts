import { contar } from "@/lib/plural";
import type { Cobertura } from "./cobertura";

/**
 * A frase do aviso de cobertura do topo do painel.
 *
 * ⚠ **Omite a parte que não existe, em vez de inventar um número.**
 * `saiuPct` é `null` quando não saiu dinheiro no mês (ver `Cobertura`): um mês
 * só de entradas parcialmente classificadas não pode dizer "cobrem 0% do que
 * saiu", porque não saiu nada. O mesmo vale para `entrouPct`.
 */
export function fraseDaCobertura(cobertura: Cobertura): string {
  const partes: string[] = [];

  if (cobertura.saiuPct !== null) {
    partes.push(`${cobertura.saiuPct}% do que saiu`);
  }
  if (cobertura.entrouPct !== null) {
    partes.push(`${cobertura.entrouPct}% do que entrou`);
  }

  // Não ocorre na prática: sem dinheiro nenhum nas duas direções, `completa`
  // é true e a tela nem chega a pedir esta frase.
  if (partes.length === 0) {
    return "Estes números ainda não cobrem todo o dinheiro do mês.";
  }

  return `Estes números cobrem ${partes.join(" e ")}.`;
}

/**
 * Quantos lançamentos ainda não caíram em pote. Sem a vírgula final: o
 * ", então os potes abaixo estão incompletos." fica no JSX.
 */
export function fraseDosPendentes(faltamDecidir: number): string {
  const verbo = faltamDecidir === 1 ? "não caiu" : "não caíram";

  return `${contar(faltamDecidir, "lançamento", "lançamentos")} ainda ${verbo} em pote nenhum`;
}
