import type { Metadata } from "next";
import Link from "next/link";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Painel · Painel Financeiro 6 Potes",
};

/** Destino vazio (tarefa B5). O painel de verdade tem spec própria. */
export default function DashboardPage() {
  return (
    <>
      <SectionTitle>Painel do mês</SectionTitle>
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
    </>
  );
}
