import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { garantirUsuario } from "@/features/autenticacao/garantir-usuario/garantirUsuario.service";
import { Andaime } from "@/features/classificacao/revisar-lancamento/Andaime";
import { estadoDe } from "@/features/classificacao/revisar-lancamento/dadosFalsos";
import { TelaDeRevisao } from "@/features/classificacao/revisar-lancamento/TelaDeRevisao";
import { resumoDeLancamentos } from "@/features/painel/resumo-de-lancamentos/resumoDeLancamentos.service";

export const metadata: Metadata = {
  title: "Revisar · Painel Financeiro 6 Potes",
};

/**
 * Duas telas convivem aqui, e isso é deliberado.
 *
 * Sem parâmetro, é a tela **verdadeira** que a D6 da spec 02 entregou: ela diz
 * quantos lançamentos esperam decisão, e diz a verdade.
 *
 * Com `?estado=`, é o **protótipo visual** da nova revisão (B1, B2 e B3),
 * esperando o portão de aprovação do Davi.
 *
 * Substituir a tela verdadeira pelo protótipo desfaria a D6 — o painel voltaria
 * a mostrar dado inventado como se fosse real. O protótipo atrás de um
 * parâmetro custa uma linha e não custa a honestidade da tela.
 *
 * A D3 apaga o protótipo e o andaime, e põe os pendentes de verdade no lugar.
 */
export default async function RevisaoPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;

  if (estado !== undefined) {
    const atual = estadoDe(estado);

    return (
      <>
        <TelaDeRevisao estado={atual} />
        <Andaime atual={atual} />
      </>
    );
  }

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
