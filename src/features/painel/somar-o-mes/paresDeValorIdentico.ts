import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";

/**
 * Entrada e saída de mesmo valor dentro do mesmo pote (tarefa A4).
 *
 * Decisão do Davi: *"Abate, mas avisa quando zera exato"*. Os dois lançamentos
 * continuam visíveis e continuam abatendo — o aviso é para ele olhar, não para
 * o app decidir sozinho.
 *
 * Valor idêntico é ambíguo: pode ser um reembolso de verdade, ou a mesma
 * transferência aparecendo nos dois arquivos.
 *
 * ## ⚠ Não é o "par que se anula" da spec 02
 *
 * A confusão seria fácil e cara, então está escrita:
 *
 * | | Par da spec 02 | Este |
 * |---|---|---|
 * | Quando roda | Na **importação** | No **painel** |
 * | O que cruza | Os dois arquivos, por data próxima | Um pote, depois da classificação |
 * | O que faz | Tira os dois do cálculo (`revisao` / `excluido`) | Marca, e os dois continuam somando |
 *
 * Mecanismos diferentes, momentos diferentes, resultados diferentes.
 */

export type LancamentoParaParear = {
  id: string;
  valorCentavos: number;
  direcao: Direcao;
};

/**
 * Os ids que merecem uma conferida.
 *
 * ## Marca **todos** os de um valor, não um par escolhido
 *
 * Com duas saídas de R$ 50 e uma entrada de R$ 50, a entrada pode corresponder
 * a qualquer uma das duas. Escolher uma seria arbitrário e erraria metade das
 * vezes; marcar as três diz "olhe estas", que é exatamente o que o aviso serve
 * para dizer.
 *
 * Valores idênticos nos dois sentidos são raros, então o ruído é pequeno e a
 * honestidade é barata.
 */
export function paresDeValorIdentico(
  lancamentos: LancamentoParaParear[],
): Set<string> {
  const porValor = new Map<number, { entradas: string[]; saidas: string[] }>();

  for (const l of lancamentos) {
    const grupo = porValor.get(l.valorCentavos) ?? { entradas: [], saidas: [] };
    (l.direcao === "entrada" ? grupo.entradas : grupo.saidas).push(l.id);
    porValor.set(l.valorCentavos, grupo);
  }

  const marcados = new Set<string>();

  for (const { entradas, saidas } of porValor.values()) {
    if (entradas.length === 0 || saidas.length === 0) continue;

    for (const id of [...entradas, ...saidas]) marcados.add(id);
  }

  return marcados;
}
