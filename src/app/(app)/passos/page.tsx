import type { Metadata } from "next";
import { PassoAPasso } from "@/features/ajuda/pegar-o-extrato/PassoAPasso";

export const metadata: Metadata = {
  title: "Como pegar o extrato · Painel Financeiro 6 Potes",
};

/**
 * `/passos` — como pegar o extrato no banco (spec 09, tarefa C1).
 *
 * Não lê banco de dados: o conteúdo é texto mais a lista de formatos que o app
 * conhece. **Fora da barra de navegação**, como as outras três rotas de apoio.
 *
 * ⚠ **Alcançável de três lugares** (tarefa C2), e o terceiro é o que mais
 * importa: a `/upload`. O gesto se repete uma vez por mês, e onze meses depois
 * ninguém lembra o menu do banco — um tutorial que só existe no primeiro acesso
 * não está lá na hora em que se precisa dele.
 *
 * O `?de=` diz para onde o "← Voltar" leva, porque a tela é a mesma vinda do
 * primeiro acesso, do painel vazio ou da `/upload`. Um destino fixo mandaria
 * para o painel quem estava enviando extrato.
 */
export default async function PassosPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string }>;
}) {
  const { de } = await searchParams;

  /*
   * ⚠ **Lista fechada, e não o valor cru.** O parâmetro vira o `href` de um
   * link; aceitar qualquer texto deixaria montar `/passos?de=https://...` e o
   * botão "Voltar" do nosso app levaria para fora dele.
   */
  const voltarPara = de === "upload" ? "/upload" : "/dashboard";

  return <PassoAPasso voltarPara={voltarPara} />;
}
