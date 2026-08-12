import type { Metadata } from "next";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Revisar · Painel Financeiro 6 Potes",
};

/** Destino vazio (tarefa B5). A revisão de verdade tem spec própria. */
export default function RevisaoPage() {
  return (
    <>
      <SectionTitle>Revisar transações</SectionTitle>
      <EstadoVazio
        emoji="✅"
        titulo="Nada para revisar"
        descricao="Depois de enviar um extrato, as transações que o motor não conseguir classificar sozinho aparecem aqui."
      />
    </>
  );
}
