"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { anoDoMes, rotuloCurtoDeMes } from "@/lib/mes";

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
 * ## ⚠ Era `flex-wrap`, e com dez meses isso virava um bloco
 *
 * O pedido do Davi: *"os meses estão organizados de maneira bagunçada"*. E
 * estavam — não por desalinho, mas porque `flex-wrap` com rótulo longo
 * (`"Junho / 2026"`, ~110px) quebrava em três linhas de alturas desiguais, e a
 * ordem do tempo deixava de ser legível: a linha de baixo começava num mês
 * qualquer, sem marca nenhuma dizendo que ali o ano continuava.
 *
 * Uma fileira que **rola de lado** não tem esse problema, porque a ordem do
 * tempo volta a ser uma direção só. O custo é que parte dela fica fora da
 * tela — e é esse custo que as setas pagam.
 *
 * ## Por que as setas andam quatro meses
 *
 * Quatro é o que caberia numa tela de celular com o rótulo curto, então um
 * toque troca aproximadamente a página inteira da fileira. Andar um mês por
 * toque faria a seta competir com o deslizar do dedo, que já faz isso melhor;
 * andar o ano inteiro passaria do que se quer ver.
 *
 * ⚠ **A medida sai do DOM, não de uma constante.** A largura de uma pílula
 * depende do rótulo, da fonte e do zoom do navegador — três coisas que mudam
 * sem avisar este arquivo. `LARGURA_DE_UM_MES` leria certo hoje e erraria na
 * primeira troca de tipografia, e erraria em silêncio: a seta andaria três
 * meses e meio, e ninguém chamaria isso de bug.
 *
 * ## ⚠ O comparativo ficou **fora** da área que rola
 *
 * Dentro dela, ele sairia da tela junto com os meses antigos — e o docblock
 * dele, escrito antes desta mudança, já dizia que ele não pode ser "o mês que
 * ninguém acha". Fora, ele está sempre visível, e a separação reforça o que
 * aquele alerta pedia: ele não se parece com um mês porque não está na fileira
 * dos meses.
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

/** Quantos meses uma seta anda por toque. Ver o docblock. */
const MESES_POR_SETA = 4;

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
  const fileira = useRef<HTMLDivElement>(null);

  /*
   * Três estados e não um: "tem para onde rolar" é diferente de "dá para
   * rolar para a esquerda". O primeiro decide se as setas existem, os outros
   * dois decidem se cada uma está apagada — e com uma variável só, a fileira
   * que cabe inteira na tela mostraria duas setas mortas.
   */
  const [rola, setRola] = useState(false);
  const [temAntes, setTemAntes] = useState(false);
  const [temDepois, setTemDepois] = useState(false);

  const medir = useCallback(() => {
    const el = fileira.current;
    if (!el) return;

    // A folga de 1px é o arredondamento de subpixel: num zoom de 110% o fim da
    // rolagem dá 847.4 contra 848, e a seta da direita nunca apagaria.
    const sobra = el.scrollWidth - el.clientWidth;

    setRola(sobra > 1);
    setTemAntes(el.scrollLeft > 1);
    setTemDepois(el.scrollLeft < sobra - 1);
  }, []);

  /*
   * ⚠ **O mês marcado é trazido para a vista, e sem `scrollIntoView`.**
   *
   * Quem abre o painel em janeiro de uma conta de dez meses precisa ver onde
   * está, e a fileira começa rolada no zero — janeiro ficaria atrás da borda
   * esquerda, invisível, enquanto a tela diz que é janeiro que está aberto.
   *
   * `scrollIntoView` resolveria e cobraria caro: mesmo com `block: "nearest"`,
   * ele é livre para rolar a **página** para alinhar o elemento, e o painel
   * abriria com o topo cortado. Mexer no `scrollLeft` do contêiner não tem como
   * tocar na página.
   */
  useEffect(() => {
    const el = fileira.current;
    if (!el) return;

    const marcado = el.querySelector<HTMLElement>("[data-marcado='sim']");

    if (marcado) {
      const centro =
        marcado.offsetLeft - (el.clientWidth - marcado.offsetWidth) / 2;
      el.scrollLeft = Math.max(0, centro);
    } else {
      /*
       * ⚠ **Sem mês marcado, abre no fim e não no começo** — é o caso da
       * `/comparativo`, onde de propósito nenhum mês é a página atual. Começar
       * no zero mostraria o mês mais antigo da conta, e o mês mais novo é o que
       * se procura: é a mesma razão pela qual `mesesEPadrao` escolhe o recente
       * como padrão e a fileira é lida do antigo para o novo.
       */
      el.scrollLeft = el.scrollWidth;
    }

    medir();

    /*
     * `ResizeObserver` e não `window.resize`: a fileira muda de largura sem a
     * janela mudar de tamanho — girar o aparelho dispara os dois, mas o teclado
     * virtual abrindo e a barra de navegação sumindo na rolagem mexem só no
     * contêiner.
     */
    const observador = new ResizeObserver(medir);
    observador.observe(el);

    return () => observador.disconnect();
  }, [medir, mes, meses]);

  const andar = (sentido: -1 | 1) => {
    const el = fileira.current;
    if (!el) return;

    /*
     * A largura de um mês sai da primeira pílula mais o `gap`, medidos agora.
     * `offsetWidth` do filho não inclui o espaço entre eles, e sem o `gap` a
     * seta andaria consistentemente de menos — 8px por mês, 32px por toque.
     */
    const primeiro = el.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const passo = primeiro ? (primeiro.offsetWidth + gap) * MESES_POR_SETA : 0;

    el.scrollBy({
      // Sem a pílula para medir, meia tela é um palpite melhor do que zero.
      left: sentido * (passo || el.clientWidth / 2),
      behavior: "smooth",
    });
  };

  return (
    <nav aria-label="Meses e comparativo">
      <div className="flex items-center gap-2">
        {rola && (
          <Seta sentido={-1} desligada={!temAntes} aoTocar={() => andar(-1)} />
        )}

        <div
          ref={fileira}
          onScroll={medir}
          /*
           * `snap-x` sem `snap-mandatory`: o encaixe ajuda o dedo a parar com
           * uma pílula inteira à vista, e a versão obrigatória brigaria com o
           * `scrollBy` das setas, que para onde foi pedido.
           *
           * ⚠ **`min-w-0` não é enfeite.** Num `flex`, este `div` não encolhe
           * abaixo do próprio conteúdo por padrão (`min-width: auto`) — sem
           * ele, dez meses empurram as setas para fora da tela em vez de rolar.
           */
          className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto py-0.5"
        >
          {meses.map((m) => {
            const marcado = aqui === "painel" && m === mes;

            return (
              <Link
                key={m}
                href={`/dashboard?mes=${m}`}
                /*
                 * ⚠ **No comparativo, nenhum mês é a página atual.** Marcar o
                 * mês de referência aqui faria o leitor de tela anunciar duas
                 * páginas atuais na mesma navegação — e faria a tela dizer que
                 * se está vendo julho quando se está vendo o ano.
                 */
                aria-current={marcado ? "page" : undefined}
                // Lido pelo efeito que centraliza. Um `ref` por mês daria o
                // mesmo resultado com um array de refs para manter em sincronia.
                data-marcado={marcado ? "sim" : undefined}
                className={`pressiona inline-flex min-h-11 shrink-0 snap-start items-center rounded-card border px-4 text-xs font-bold ${
                  marcado
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border2 bg-card text-dim hover:bg-card2 hover:text-text"
                }`}
              >
                {rotuloCurtoDeMes(m)}
              </Link>
            );
          })}
        </div>

        {rola && (
          <Seta sentido={1} desligada={!temDepois} aoTocar={() => andar(1)} />
        )}
      </div>

      <AbaDoComparativo meses={meses} mes={mes} aqui={aqui} />
    </nav>
  );
}

/**
 * Uma das duas setas.
 *
 * ⚠ **`disabled` e não `hidden` na ponta da fileira.** Uma seta que desaparece
 * ao chegar no fim muda a largura da fileira no mesmo quadro em que ela para de
 * rolar, e tudo pula de lado. Apagada, ela continua ocupando o lugar — e diz
 * uma coisa verdadeira: existe uma direção, e ela acabou.
 *
 * O rótulo diz quantos meses, porque "anterior" num leitor de tela não
 * distingue esta seta de uma que andasse um mês.
 */
function Seta({
  sentido,
  desligada,
  aoTocar,
}: {
  sentido: -1 | 1;
  desligada: boolean;
  aoTocar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      disabled={desligada}
      aria-label={
        sentido === -1
          ? `${MESES_POR_SETA} meses antes`
          : `${MESES_POR_SETA} meses depois`
      }
      className="pressiona inline-flex size-11 shrink-0 items-center justify-center rounded-card border border-border2 bg-card text-dim hover:bg-card2 hover:text-text disabled:pointer-events-none disabled:opacity-30"
    >
      <span aria-hidden="true" className="text-sm font-bold">
        {sentido === -1 ? "‹" : "›"}
      </span>
    </button>
  );
}

/**
 * ⚠ **Some quando a conta tem um mês só**, e é a mesma decisão da
 * `ChamadaDoComparativo`, com o motivo escrito lá: convidar para o comparativo
 * quem tem um mês é convidar para uma tela que vai dizer "ainda não dá para
 * comparar".
 *
 * ⚠ **Ela não pode parecer mais um mês.** Onze meses e um comparativo na mesma
 * linha, com a mesma forma, fariam dela o mês que ninguém acha. Daí o emoji e a
 * cor azul — a mesma do `tab-dot` dela no painel original. O traço de separação
 * que cumpria parte desse papel saiu junto com a fileira que rola: agora o que
 * a separa dos meses é a linha de baixo, que é separação mais forte do que um
 * risco de 1px.
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
    <Link
      href={`/comparativo?ano=${anoDoMes(mes)}`}
      aria-current={marcada ? "page" : undefined}
      className={`pressiona mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-card border px-4 text-xs font-bold ${
        marcada
          ? "border-blue/40 bg-blue/10 text-blue"
          : "border-border2 bg-card text-dim hover:bg-card2 hover:text-text"
      }`}
    >
      <span aria-hidden="true">📊</span>
      Comparativo
    </Link>
  );
}
