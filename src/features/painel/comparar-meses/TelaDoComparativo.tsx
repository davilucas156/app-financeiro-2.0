import Link from "next/link";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Voltar } from "@/components/ui/Voltar";
import { AbasDoPainel } from "@/features/painel/navegar-entre-meses/AbasDoPainel";
import { CartoesDoAno } from "./CartoesDoAno";
import { SecaoDoComparativo } from "./SecaoDoComparativo";
import { SeletorDeAno } from "./SeletorDeAno";
import type { CartaoDoAno } from "./cartaoDoAno";
import type { Comparativo } from "./comparativo";

/**
 * `/comparativo` — os potes mês a mês, dentro de um ano (spec 09 A1, spec 12).
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
 * ## O recorte por ano conserta o que a spec 09 só mudou de lugar
 *
 * ⚠ Tirar o comparativo do painel resolveu o painel, **não o crescimento**: a
 * tela continuava desenhando todos os meses da conta, e em dezembro do segundo
 * ano seriam mais de 200 linhas de barra aqui. Um ano por vez é o teto que
 * faltava — e é o que o painel original do Davi fazia, com o título
 * "Comparativo Anual 2026".
 *
 * ## Esta tela não tem seletor de mês, e é a diferença entre as duas
 *
 * O painel é sobre **um** mês; esta é sobre **um ano**. Um seletor de mês aqui
 * criaria a pergunta "de que mês é este comparativo?", que não tem resposta boa.
 *
 * ⚠ **O mês de referência é escrito, e não deduzido.** "Comparado com maio"
 * precisa de sujeito: comparado com maio, **o quê**? Quem passa a frase é a
 * `SecaoDoComparativo`, que já era dona do texto.
 *
 * ## A ordem: resumo antes de detalhe
 *
 * Cartões e depois barras. O cartão responde "quanto foi no ano"; a barra
 * responde "como foi distribuído". Invertê-los faria a tela pedir que se
 * somasse doze barras de cabeça para chegar ao número que o cartão já dá.
 */
export function TelaDoComparativo({
  comparativo,
  cartoes,
  potes,
  meses,
  anos,
  ano,
  mesMaisRecente,
}: {
  comparativo: Comparativo;
  cartoes: CartaoDoAno[];
  potes: { id: string; nome: string; emoji: string; cor: string }[];
  /** Todos os meses da conta, para a fileira de abas. */
  meses: string[];
  /** Os anos que a conta tem. */
  anos: string[];
  /** O ano que esta tela está mostrando. */
  ano: string;
  /** `null` quando a conta ainda não tem mês nenhum. */
  mesMaisRecente: string | null;
}) {
  if (mesMaisRecente === null) {
    return (
      <>
        <SectionTitle>Comparativo</SectionTitle>
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
    );
  }

  return (
    <>
      {/*
        ⚠ **A mesma fileira do painel** (spec 12, B3). Aba que existe numa tela
        só é link, não aba: o que a faz aba é continuar aqui, mostrando onde se
        está. É o pedido do Davi ao pé da letra — no painel original dele, a
        fileira era global e a última aba era esta tela.
      */}
      <AbasDoPainel meses={meses} mes={mesMaisRecente} aqui="comparativo" />

      {/*
        A volta explícita continua, como na `/categorias` e na `/configuracoes`
        (B2 da spec 07): a rota fica fora da barra de navegação, e no app
        instalado não existe botão de voltar — sobra o gesto de borda, que
        funciona e não aparece. A fileira leva a um mês; esta leva "de volta".
      */}
      <Voltar para="/dashboard" className="mt-4">
        Painel
      </Voltar>

      {/*
        ⚠ **O seletor fica embaixo do título, e não na mesma linha.** O
        `SectionTitle` termina numa régua `flex-1`; dentro de uma linha
        compartilhada ela colapsaria a zero, e o título perderia a forma que ele
        tem em todas as outras telas.
      */}
      <SectionTitle>Comparativo {ano}</SectionTitle>
      <SeletorDeAno anos={anos} ano={ano} />

      <AvisoDeAnoCurto comparativo={comparativo} anos={anos} ano={ano} />

      <CartoesDoAno cartoes={cartoes} potes={potes} ano={ano} />

      <div className="mt-8">
        <SecaoDoComparativo
          comparativo={comparativo}
          potes={potes}
          mesDeReferencia={mesMaisRecente}
        />
      </div>
    </>
  );
}

/**
 * O preço do recorte por ano, dito na tela (spec 12, tarefa C2).
 *
 * ⚠ **Em janeiro, a média se cala mesmo com um ano inteiro de dado atrás.** Não
 * há mês anterior *dentro do ano*, e é assim que o recorte funciona. Sem esta
 * linha, quem acabou de virar o ano abre a tela, vê "este é o primeiro mês" e
 * conclui que o app perdeu o histórico dele.
 *
 * Só aparece quando **existe** ano anterior na conta: para quem realmente está
 * no primeiro mês, a frase da `SecaoDoComparativo` já diz a coisa certa e manda
 * para o `/upload`.
 */
function AvisoDeAnoCurto({
  comparativo,
  anos,
  ano,
}: {
  comparativo: Comparativo;
  anos: string[];
  ano: string;
}) {
  if (comparativo.media.pode) return null;

  const anteriores = anos.filter((a) => a < ano);
  const anterior = anteriores.at(-1);

  if (anterior === undefined) return null;

  return (
    <p className="mt-3 text-xs leading-relaxed text-dim">
      {ano} ainda não tem meses suficientes para uma média.{" "}
      <Link
        href={`/comparativo?ano=${anterior}`}
        className="text-text underline underline-offset-4"
      >
        Ver {anterior}
      </Link>
      .
    </p>
  );
}
