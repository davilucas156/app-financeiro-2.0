import type { Metadata } from "next";
import Link from "next/link";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { resumoDeLancamentos } from "@/features/painel/resumo-de-lancamentos/resumoDeLancamentos.service";
import { ResumoDoQueEntrou } from "@/features/painel/resumo-de-lancamentos/ResumoDoQueEntrou";

export const metadata: Metadata = {
  title: "Painel · Painel Financeiro 6 Potes",
};

/**
 * O painel de verdade tem spec própria (potes, categorias, comparações).
 *
 * A D6 resolve uma coisa só: **o vazio parar de mentir**. Dizer "nenhum mês
 * fechado ainda" depois de você importar 54 lançamentos ensinava a não
 * confiar na tela — e era exatamente o que acontecia até aqui.
 */
export default async function DashboardPage() {
  const usuario = await garantirUsuario();
  const resumo = await resumoDeLancamentos(usuario.id);

  return (
    <>
      <SectionTitle>Painel do mês</SectionTitle>

      {resumo.total === 0 ? (
        <EstadoVazio
          emoji="📦"
          titulo="Nenhum mês fechado ainda"
          descricao="Envie o extrato da conta e da fatura para o painel montar seus potes, categorias e insights."
          acao={
            <Link
              href="/upload"
              className="inline-flex min-h-11 items-center rounded-card bg-primary px-5 text-sm font-bold text-bg transition-colors hover:bg-orange"
            >
              Enviar extrato
            </Link>
          }
        />
      ) : (
        <ResumoDoQueEntrou resumo={resumo} />
      )}
    </>
  );
}
