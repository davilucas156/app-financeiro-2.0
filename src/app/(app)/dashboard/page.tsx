import type { Metadata } from "next";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { coberturaDosMeses } from "@/features/painel/comparar-meses/coberturaDosMeses.service";
import { mediaDoPainel } from "@/features/painel/comparar-meses/mediaDoPainel";
import { dadosDoPainel } from "@/features/painel/painel-do-mes/painelDoMes.service";
import { PainelVazio } from "@/features/painel/painel-do-mes/PainelVazio";
import { TelaDoPainel } from "@/features/painel/painel-do-mes/TelaDoPainel";

export const metadata: Metadata = {
  title: "Painel",
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
}: PageProps<"/dashboard">) {
  const usuario = await garantirUsuario();
  const { mes: mesDaUrl } = await searchParams;
  // `?mes=a&mes=b` chega como array; só texto único vira pedido de mês.
  const mes = typeof mesDaUrl === "string" ? mesDaUrl : undefined;

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

  if (!dados) return <PainelVazio />;

  /*
   * ⚠ **A frase recorta pelo ano, como a `/comparativo` (spec 12, C1).** A regra
   * e o porquê estão em `mediaDoPainel`. O recorte é sobre `cobertura`, a
   * consulta barata: não volte a chamar `historicoDosMeses` aqui.
   */
  const media = mediaDoPainel(cobertura, dados.mes);

  return <TelaDoPainel {...dados} media={media} />;
}
