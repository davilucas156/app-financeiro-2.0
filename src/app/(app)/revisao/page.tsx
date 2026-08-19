import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { resumoDeLancamentos } from "@/features/painel/resumo-de-lancamentos/resumoDeLancamentos.service";

export const metadata: Metadata = {
  title: "Revisar · Painel Financeiro 6 Potes",
};

/**
 * A revisão de verdade tem spec própria.
 *
 * Esta tela entra na D6 pelo mesmo motivo que o painel: assim que a
 * importação passou a marcar pares que se anulam, "Nada para revisar" virou
 * mentira aqui também. Corrigir o painel e deixar esta mentindo seria trocar
 * um problema de lugar.
 */
export default async function RevisaoPage() {
  const usuario = await garantirUsuario();
  const { emRevisao } = await resumoDeLancamentos(usuario.id);

  return (
    <>
      <SectionTitle>Revisar transações</SectionTitle>

      {emRevisao === 0 ? (
        <EstadoVazio
          emoji="✅"
          titulo="Nada para revisar"
          descricao="Depois de enviar um extrato, as transações que o motor não conseguir classificar sozinho aparecem aqui."
        />
      ) : (
        <Card className="border-gold/20 bg-gold/8">
          <p className="text-xs font-bold text-gold">
            {emRevisao === 1
              ? "1 lançamento esperando você decidir."
              : `${emRevisao} lançamentos esperando você decidir.`}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-dim">
            São lançamentos que parecem se anular entre si — mesmo valor,
            sentidos opostos, datas próximas. Nada foi apagado e nada some
            enquanto você não decidir. A tela para decidir ainda não existe: é
            uma spec própria, logo depois da classificação.
          </p>
        </Card>
      )}
    </>
  );
}
