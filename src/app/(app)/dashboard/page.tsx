import type { Metadata } from "next";
import Link from "next/link";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { coberturaDosMeses } from "@/features/painel/comparar-meses/coberturaDosMeses.service";
import { mediaDoComparativo } from "@/features/painel/comparar-meses/comparativo";
import { dadosDoPainel } from "@/features/painel/painel-do-mes/painelDoMes.service";
import { TelaDoPainel } from "@/features/painel/painel-do-mes/TelaDoPainel";

export const metadata: Metadata = {
  title: "Painel · Painel Financeiro 6 Potes",
};

/**
 * O painel do mês (tarefa D5 da spec 04).
 *
 * ## O que saiu daqui
 *
 * `ResumoDoQueEntrou` era o painel provisório da D6 da spec 02: contava
 * lançamentos porque não havia como somar dinheiro em pote nenhum. Saiu inteiro
 * junto com `resumoDeLancamentos` e `avisoDoPainel` — o aviso "N esperam sua
 * decisão" da D8 **não sumiu**, virou a cobertura em dinheiro no topo da tela,
 * que é a mesma promessa medida melhor.
 *
 * Deixar os dois convivendo seria manter duas contagens do mesmo mês, e duas
 * contagens divergem no dia em que uma delas for ajustada.
 *
 * O `mes` vem da URL e é conferido contra os meses da própria conta dentro do
 * serviço — um mês inventado cai no mais recente em vez de virar consulta.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const usuario = await garantirUsuario();
  const { mes } = await searchParams;

  /*
   * ⚠ **A segunda leitura é barata de propósito** (spec 09).
   *
   * Até a spec 08 esta página buscava o `historicoDosMeses` inteiro — gasto por
   * pote, mês a mês — para desenhar o comparativo aqui embaixo. O comparativo
   * virou tela própria, e o que sobrou no painel é **uma frase**: "Julho
   * comparado com a média de 3 meses". Ela se decide com mês e cobertura, sem a
   * soma por pote.
   *
   * ⚠ **Não volte a chamar `historicoDosMeses` aqui.** Era metade do custo
   * desta página, e ela já faz outras cinco consultas.
   */
  const [dados, cobertura] = await Promise.all([
    dadosDoPainel(usuario.id, mes),
    coberturaDosMeses(usuario.id),
  ]);

  if (!dados) {
    return (
      <>
        <SectionTitle>Painel do mês</SectionTitle>
        <EstadoVazio
          emoji="📦"
          titulo="Nenhum mês no banco ainda"
          descricao="Envie o extrato da conta e da fatura para o painel montar seus potes."
          acao={
            <span className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/upload"
                className="inline-flex min-h-11 items-center rounded-card bg-primary px-5 text-sm font-bold text-bg transition-colors hover:bg-orange"
              >
                Enviar extrato
              </Link>
              {/*
                ⚠ **O segundo caminho até a `/passos` (spec 09, C2).** Quem chega
                aqui pelo "Começar" do primeiro acesso está olhando uma tela vazia
                e um botão que pede um arquivo que ele ainda não tem.
              */}
              <Link
                href="/passos"
                className="inline-flex min-h-11 items-center rounded-card border border-border2 px-5 text-sm font-bold text-text transition-colors hover:bg-card2"
              >
                Como pegar o extrato
              </Link>
            </span>
          }
        />
      </>
    );
  }

  return (
    <TelaDoPainel {...dados} media={mediaDoComparativo(cobertura, dados.mes)} />
  );
}
