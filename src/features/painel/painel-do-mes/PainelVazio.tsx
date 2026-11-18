import Link from "next/link";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ROTA_PASSOS } from "@/features/autenticacao/rotas-de-acesso";

/**
 * O painel de quem ainda não tem nenhum mês no banco.
 *
 * Saiu da rota `/dashboard` para ela ficar só com a decisão ("há dados?"), e
 * não com o desenho do caso vazio.
 */
export function PainelVazio() {
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
              href={ROTA_PASSOS}
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
