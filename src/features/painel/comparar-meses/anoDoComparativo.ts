import { anoDoMes } from "@/lib/mes";
import type { MesComCobertura } from "./comparativo";

/**
 * O recorte por ano do comparativo (spec 12, tarefa A1).
 *
 * ## Recortar por ano é filtrar um array, e é só isso
 *
 * `compararMeses` recebe o histórico já pronto e faz todo o resto em memória;
 * `mediaDoComparativo` filtra `m.mes < mesAtual` de dentro do que recebeu.
 * Então **passar só os meses de um ano recorta a tela inteira** — as barras, a
 * média e a frase — sem tocar em nenhuma das duas funções.
 *
 * Era a Descoberta 2 da spec, e ela é o que fez esta funcionalidade caber numa
 * spec pequena: se `compararMeses` precisar mudar para o ano existir, o desenho
 * está errado.
 *
 * ## Sem `server-only`, como o `comparativo.ts`
 *
 * Não toca banco, não lê sessão, não guarda segredo. Marcá-lo como exclusivo do
 * servidor impediria de testá-lo sem ganhar segurança nenhuma.
 *
 * ## Sem `Date`, como o `lib/mes.ts`
 *
 * `"2026-06" < "2026-07"` é verdade porque o formato é fixo e zero-preenchido —
 * o mesmo motivo pelo qual `mes_referencia` é `YYYY-MM` no banco desde a spec
 * 02. Ano aqui é recorte de texto, não conta de tempo.
 */

/**
 * Os anos que a conta tem, do mais antigo ao mais novo.
 *
 * ⚠ **Crescente, como a fileira de meses.** O seletor de ano fica ao lado de uma
 * navegação que já é cronológica; inverter um dos dois faria a mesma tela ser
 * lida em duas direções.
 */
export function anosDoHistorico(meses: MesComCobertura[]): string[] {
  return [...new Set(meses.map((m) => anoDoMes(m.mes)))].sort();
}

/**
 * O ano a abrir: o pedido, quando a conta tem mês nele; senão o do mês de
 * referência.
 *
 * ⚠ **Nunca devolve ano sem mês.** É a mesma disciplina do `mes` da
 * `dadosDoPainel`, que confere o valor da URL contra os meses da própria conta.
 * Um `?ano=` inventado — ou `?ano=<script>` — cai no padrão em vez de virar uma
 * consulta vazia que chega à tela com cara de defeito.
 */
export function anoEscolhido(
  meses: MesComCobertura[],
  mesDeReferencia: string,
  pedido: string | undefined | null,
): string {
  const padrao = anoDoMes(mesDeReferencia);

  if (pedido == null) return padrao;

  return anosDoHistorico(meses).includes(pedido) ? pedido : padrao;
}

/**
 * Só os meses de um ano.
 *
 * Genérica sobre `MesComCobertura` porque serve às duas consultas: o histórico
 * caro da `/comparativo` (`MesNoHistorico`, com o gasto por pote) e a cobertura
 * barata do painel. Sem o genérico, o painel perderia o tipo ao recortar e
 * precisaria de um `as` para chamar `mediaDoComparativo`.
 */
export function mesesDoAno<T extends MesComCobertura>(
  meses: T[],
  ano: string,
): T[] {
  return meses.filter((m) => anoDoMes(m.mes) === ano);
}
