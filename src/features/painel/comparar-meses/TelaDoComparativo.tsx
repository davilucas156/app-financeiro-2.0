import Link from "next/link";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SecaoDoComparativo } from "./SecaoDoComparativo";
import type { Comparativo } from "./comparativo";

/**
 * `/comparativo` — os potes mês a mês (spec 09, tarefa A1).
 *
 * ## Por que saiu do painel
 *
 * O painel tinha 18 cartões e metade era de outro assunto. Pior: o comparativo
 * **cresce sozinho** — uma barra por mês da conta, em cada pote. Com dois meses
 * são 27 linhas de barra; em dezembro seriam 117, embaixo dos potes de quem só
 * queria saber como foi o mês.
 *
 * São duas perguntas. "Como foi este mês" e "o que está acontecendo ao longo do
 * ano" merecem cada uma a sua tela, e quem abre o painel no dia 5 quase sempre
 * veio fazer a primeira.
 *
 * ## Esta tela não tem seletor de mês, e é a diferença entre as duas
 *
 * O painel é sobre **um** mês; esta é sobre **todos**. Um seletor aqui criaria
 * a pergunta "de que mês é este comparativo?", que não tem resposta boa.
 *
 * ⚠ **O mês de referência é escrito, e não deduzido.** "Comparado com maio"
 * precisa de sujeito: comparado com maio, **o quê**? Sem dizer qual é o mês
 * mais recente, a tela inteira é um predicado solto. Quem passa a frase é a
 * `SecaoDoComparativo`, que já era dona do texto.
 */
export function TelaDoComparativo({
  comparativo,
  potes,
  mesMaisRecente,
}: {
  comparativo: Comparativo;
  potes: { id: string; nome: string; emoji: string; cor: string }[];
  /** `null` quando a conta ainda não tem mês nenhum. */
  mesMaisRecente: string | null;
}) {
  return (
    <>
      {/*
        A volta explícita, como na `/categorias` e na `/configuracoes` (B2 da
        spec 07): a rota fica fora da barra de navegação, e no app instalado
        não existe botão de voltar — sobra o gesto de borda, que funciona e
        não aparece.
      */}
      <Link
        href="/dashboard"
        className="inline-flex min-h-11 items-center font-mono text-3xs font-bold tracking-wider text-dim uppercase transition-colors hover:text-text"
      >
        ← Painel
      </Link>

      {mesMaisRecente === null ? (
        <>
          <SectionTitle className="mt-2">Comparativo</SectionTitle>
          <EstadoVazio
            emoji="📊"
            titulo="Nenhum mês no banco ainda"
            descricao="O comparativo compara meses. Envie o primeiro extrato e ele começa a se montar sozinho."
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
      ) : (
        <div className="mt-2">
          <SecaoDoComparativo
            comparativo={comparativo}
            potes={potes}
            mesDeReferencia={mesMaisRecente}
          />
        </div>
      )}
    </>
  );
}
