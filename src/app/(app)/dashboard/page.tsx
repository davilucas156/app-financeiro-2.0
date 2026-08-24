import type { Metadata } from "next";
import Link from "next/link";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { compararMeses } from "@/features/painel/comparar-meses/comparativo";
import { historicoDosMeses } from "@/features/painel/comparar-meses/historicoDosMeses.service";
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
   * ⚠ **As duas leituras em paralelo, e o histórico não depende do mês.**
   *
   * `historicoDosMeses` devolve a conta inteira, e quem recorta é a
   * `compararMeses` com o mês escolhido. Fazer o servidor filtrar por mês daria
   * uma consulta nova a cada troca no seletor para devolver as mesmas linhas.
   */
  const [dados, historico] = await Promise.all([
    dadosDoPainel(usuario.id, mes),
    historicoDosMeses(usuario.id),
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
            <Link
              href="/upload"
              className="inline-flex min-h-11 items-center rounded-card bg-primary px-5 text-sm font-bold text-bg transition-colors hover:bg-orange"
            >
              Enviar extrato
            </Link>
          }
        />
      </>
    );
  }

  return (
    <TelaDoPainel
      {...dados}
      comparativo={compararMeses(historico, dados.mes)}
    />
  );
}
