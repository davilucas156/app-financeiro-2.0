import Link from "next/link";
import { anoDoMes, rotuloDeMes } from "@/lib/mes";

/**
 * A fileira de abas do painel (spec 12, tarefas B1, B2 e B3).
 *
 * ## Ela veio de dentro do `TopoDoMes.tsx`, e a mudança de endereço é a tarefa
 *
 * Enquanto navegava só entre meses, ela era o topo do painel e morava lá. Agora
 * navega entre **duas telas**, e deixá-la onde estava faria a `/comparativo`
 * importar o componente que desenha entrou/saiu/diferença para desenhar uma
 * linha de abas.
 *
 * ## A aba que faltava estava no painel original
 *
 * O `planejamento_anual_davi.html` tem uma aba por período e a **última é
 * `📊 Comparativo Anual`** — o pedido do Davi era literalmente essa aba de
 * volta. A fileira daqui era aquela fileira, sem o último item.
 *
 * ⚠ **Ela aparece nas duas telas, e é isso que a faz aba.** Um item que só
 * existe numa das telas é um link; aba é o que continua na tela para onde ela
 * leva, mostrando onde se está (pendência 7 da spec).
 *
 * ## Estes eram `<span>`, e o seletor não levava a lugar nenhum
 *
 * A história vem junto da mudança de endereço, porque o defeito pode voltar do
 * mesmo jeito. Ele nasceu no protótipo visual da spec 04 (`1b3d195`), quando
 * nada da tela era ligado. O servidor foi ligado depois e ficou **completo** — a
 * `dashboard/page.tsx` lê `?mes=` e a `dadosDoPainel` confere o valor contra os
 * meses da própria conta. Só o elemento nunca virou link.
 *
 * O defeito era mudo do pior jeito: com alvo de toque de 44px, borda, hover e o
 * mês atual em destaque, ele **parecia** funcionar. Quem tinha um mês só não
 * notava; quem subiu o segundo tocou e não aconteceu nada.
 *
 * ⚠ **O mês atual continua sendo link para ele mesmo.** Desabilitá-lo pouparia
 * uma navegação e tiraria o único jeito de recarregar a tela sem perder o mês
 * escolhido.
 */
export function AbasDoPainel({
  meses,
  mes,
  aqui,
}: {
  /** Todos os meses da conta, do mais antigo ao mais novo. */
  meses: string[];
  /**
   * O mês de referência: no painel é o que se está vendo, no comparativo é o
   * mais recente da conta. É dele que sai o ano para onde a aba leva.
   */
  mes: string;
  aqui: "painel" | "comparativo";
}) {
  return (
    <nav
      aria-label="Meses e comparativo"
      className="flex flex-wrap items-center gap-2"
    >
      {meses.map((m) => (
        <Link
          key={m}
          href={`/dashboard?mes=${m}`}
          /*
           * ⚠ **No comparativo, nenhum mês é a página atual.** Marcar o mês de
           * referência aqui faria o leitor de tela anunciar duas páginas atuais
           * na mesma navegação — e faria a tela dizer que se está vendo julho
           * quando se está vendo o ano.
           */
          aria-current={aqui === "painel" && m === mes ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-card border px-4 text-xs font-bold transition-colors ${
            aqui === "painel" && m === mes
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border2 bg-card text-dim hover:bg-card2 hover:text-text"
          }`}
        >
          {rotuloDeMes(m)}
        </Link>
      ))}

      <AbaDoComparativo meses={meses} mes={mes} aqui={aqui} />
    </nav>
  );
}

/**
 * ⚠ **Some quando a conta tem um mês só**, e é a mesma decisão da
 * `ChamadaDoComparativo`, com o motivo escrito lá: convidar para o comparativo
 * quem tem um mês é convidar para uma tela que vai dizer "ainda não dá para
 * comparar".
 *
 * ⚠ **Ela não pode parecer mais um mês.** Onze meses e um comparativo na mesma
 * linha, com a mesma forma, fariam dela o mês que ninguém acha. Daí o emoji, o
 * traço de separação e a cor azul — a mesma do `tab-dot` dela no painel
 * original.
 *
 * ⚠ **Leva o ano do mês de referência.** Sem isso, quem está olhando dezembro
 * de 2025 tocaria na aba e cairia em 2026, que é o padrão da rota — o ano do
 * mês mais recente da conta, não o do mês que ele estava vendo.
 */
function AbaDoComparativo({
  meses,
  mes,
  aqui,
}: {
  meses: string[];
  mes: string;
  aqui: "painel" | "comparativo";
}) {
  if (meses.length < 2) return null;

  const marcada = aqui === "comparativo";

  return (
    <>
      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border2" />

      <Link
        href={`/comparativo?ano=${anoDoMes(mes)}`}
        aria-current={marcada ? "page" : undefined}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-card border px-4 text-xs font-bold transition-colors ${
          marcada
            ? "border-blue/40 bg-blue/10 text-blue"
            : "border-border2 bg-card text-dim hover:bg-card2 hover:text-text"
        }`}
      >
        <span aria-hidden="true">📊</span>
        Comparativo
      </Link>
    </>
  );
}
