import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { compararMeses } from "@/features/painel/comparar-meses/comparativo";
import { historicoDosMeses } from "@/features/painel/comparar-meses/historicoDosMeses.service";
import { TelaDoComparativo } from "@/features/painel/comparar-meses/TelaDoComparativo";
import { dadosDoPainel } from "@/features/painel/painel-do-mes/painelDoMes.service";

export const metadata: Metadata = {
  title: "Comparativo · Painel Financeiro 6 Potes",
};

/**
 * `/comparativo` — os potes mês a mês (spec 09, tarefa A1).
 *
 * A rota compõe e busca. O `user_id` sai de `garantirUsuario()` e nunca de um
 * parâmetro — é a razão de `historicoDosMeses` não aceitar id de fora.
 *
 * **Fora da barra de navegação** (pendência 1): são 4 itens desde a D9 da spec
 * 03, e a 360px um quinto derrubaria o alvo de toque abaixo dos 44px. O caminho
 * até aqui é a chamada no fim do painel, exatamente onde o comparativo estava.
 *
 * ⚠ **O mês de referência é o mais recente da conta, e não vem da URL.** Esta
 * tela não tem seletor de mês (pendência 2): o painel é sobre um mês, esta é
 * sobre todos. Sem um mês fixo, "comparado com maio" não teria sujeito.
 *
 * ⚠ **`dadosDoPainel` é chamada só pelos potes** — nome, emoji e cor, que o
 * `historicoDosMeses` não devolve (ele traz id e total). Sem ela a tela teria
 * nove barras sem saber de quem são.
 */
export default async function ComparativoPage() {
  const usuario = await garantirUsuario();

  const [dados, historico] = await Promise.all([
    dadosDoPainel(usuario.id),
    historicoDosMeses(usuario.id),
  ]);

  const mesMaisRecente = dados?.mes ?? null;

  return (
    <TelaDoComparativo
      mesMaisRecente={mesMaisRecente}
      comparativo={compararMeses(historico, mesMaisRecente ?? "")}
      potes={(dados?.potes ?? [])
        .filter((p) => p.tipo === "gasto")
        .map((p) => ({ id: p.id, nome: p.nome, emoji: p.emoji, cor: p.cor }))}
    />
  );
}
