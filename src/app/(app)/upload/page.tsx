import type { Metadata } from "next";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Enviar extrato · Painel Financeiro 6 Potes",
};

/** Destino vazio (tarefa B5). O upload de verdade tem spec própria. */
export default function UploadPage() {
  return (
    <>
      <SectionTitle>Enviar extrato</SectionTitle>
      <EstadoVazio
        emoji="📄"
        titulo="Nenhum extrato enviado"
        descricao="Aqui você vai enviar o CSV da conta corrente e o da fatura do cartão, um mês por vez."
      />
    </>
  );
}
