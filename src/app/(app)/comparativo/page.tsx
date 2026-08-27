import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import {
  anoEscolhido,
  anosDoHistorico,
  mesesDoAno,
} from "@/features/painel/comparar-meses/anoDoComparativo";
import { cartoesDoAno } from "@/features/painel/comparar-meses/cartaoDoAno";
import { compararMeses } from "@/features/painel/comparar-meses/comparativo";
import { historicoDosMeses } from "@/features/painel/comparar-meses/historicoDosMeses.service";
import { TelaDoComparativo } from "@/features/painel/comparar-meses/TelaDoComparativo";
import { dadosDoPainel } from "@/features/painel/painel-do-mes/painelDoMes.service";

export const metadata: Metadata = {
  title: "Comparativo · Painel Financeiro 6 Potes",
};

/**
 * `/comparativo` — os potes mês a mês, dentro de um ano (spec 09 A1, spec 12).
 *
 * A rota compõe e busca. O `user_id` sai de `garantirUsuario()` e nunca de um
 * parâmetro — é a razão de `historicoDosMeses` não aceitar id de fora.
 *
 * **Fora da barra de navegação** (spec 09, pendência 1): são 4 itens desde a D9
 * da spec 03, e a 360px um quinto derrubaria o alvo de toque abaixo dos 44px. O
 * caminho até aqui é a aba no topo e a chamada no fim do painel.
 *
 * ⚠ **O mês de referência é o mais recente da conta, e não vem da URL.** Esta
 * tela não tem seletor de mês (spec 09, pendência 2): o painel é sobre um mês,
 * esta é sobre um ano. Sem um mês fixo, "comparado com maio" não teria sujeito.
 *
 * ⚠ **`dadosDoPainel` é chamada pelos potes e pela fileira de abas** — nome,
 * emoji e cor, que o `historicoDosMeses` não devolve (ele traz id e total), e a
 * lista de meses da conta. Sem ela a tela teria nove barras sem saber de quem
 * são, e nenhuma aba.
 *
 * ⚠ **Continuam sendo duas consultas.** A spec 12 acrescentou o ano e os
 * cartões sem uma terceira: o recorte é um filtro de array, e o cartão nasce de
 * `comparativo.linhas`.
 */
export default async function ComparativoPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const usuario = await garantirUsuario();
  const { ano: anoPedido } = await searchParams;

  const [dados, historico] = await Promise.all([
    dadosDoPainel(usuario.id),
    historicoDosMeses(usuario.id),
  ]);

  const mesMaisRecente = dados?.mes ?? null;

  /*
   * ⚠ **O `?ano=` passa por `anoEscolhido` antes de qualquer coisa.** Um ano que
   * a conta não tem cairia num recorte vazio, e a tela mostraria "nenhum mês"
   * para quem tem dois anos de extrato — indistinguível de um defeito. É a
   * mesma disciplina que a `dadosDoPainel` aplica ao `?mes=`.
   */
  const anos = anosDoHistorico(historico);
  const ano = anoEscolhido(historico, mesMaisRecente ?? "", anoPedido);

  /*
   * ⚠ **`compararMeses` não sabe o que é ano, e continua não sabendo.** O
   * recorte inteiro — barras, média e frase — é este filtro (Descoberta 2 da
   * spec 12). Se um dia ela precisar de um parâmetro de ano, o desenho quebrou.
   */
  const comparativo = compararMeses(
    mesesDoAno(historico, ano),
    mesMaisRecente ?? "",
  );

  return (
    <TelaDoComparativo
      mesMaisRecente={mesMaisRecente}
      comparativo={comparativo}
      cartoes={cartoesDoAno(comparativo.linhas)}
      meses={dados?.meses ?? []}
      anos={anos}
      ano={ano}
      potes={(dados?.potes ?? [])
        .filter((p) => p.tipo === "gasto")
        .map((p) => ({ id: p.id, nome: p.nome, emoji: p.emoji, cor: p.cor }))}
    />
  );
}
