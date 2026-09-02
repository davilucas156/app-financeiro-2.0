import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * O caminho de volta das rotas que ficam fora da barra de navegação.
 *
 * ## Por que ele existe como componente
 *
 * ⚠ **A mesma linha estava copiada em cinco telas — e uma delas já tinha
 * divergido.** `/comparativo`, `/categorias`, `/formatos` e `/passos` usavam
 * `text-3xs`; a `/configuracoes` usava `text-4xs`. Ninguém decidiu isso: é o
 * que acontece com regra escrita cinco vezes. A regra do projeto vale aqui —
 * regra escrita duas vezes vira arquivo.
 *
 * ## Por que ele mudou de forma
 *
 * Pedido do Davi: _"melhore a visualização do botão de voltar na tela"_.
 *
 * Ele era **texto solto**: 10px, caixa alta, em `dim`. Tinha os 44px de alvo de
 * toque, e nada que dissesse que ali havia um alvo — parecia o rótulo da seção
 * de cima. Num app instalado isso é caro: não existe botão de voltar do
 * navegador, sobra o gesto de borda, que funciona e **não aparece**. Este link é
 * o único caminho visível de volta, e ele estava escondido.
 *
 * Agora é uma pastilha com borda e fundo — a mesma casca do `Button`
 * `secondary`, que é o que o app já usa para "isto é clicável e não é a ação
 * principal".
 *
 * ⚠ **A letra continua mono, em caixa alta.** É o idioma de **rótulo** do
 * design system, herdado do `planejamento_anual_davi.html` (`.section-t`,
 * `.sc-lbl`, `.fi-lbl`). Navegar não é agir: o `AcaoDeVoltar` da `/revisao`
 * desfaz uma classificação e por isso é um botão de texto normal. Os dois
 * dizem "← Voltar" e fazem coisas diferentes — a diferença de letra é o que
 * impede que se pareçam.
 *
 * ⚠ **A seta é decorativa, e o leitor de tela ouve a frase inteira.** "←" lido
 * em voz alta não é informação, e "Painel" sozinho é indistinguível do item de
 * navegação com o mesmo nome. O `sr-only` resolve os dois de uma vez.
 */
export function Voltar({
  para,
  className,
  children,
}: {
  /** Para onde volta. Nem sempre é o painel: a `/formatos` volta ao `/upload`. */
  para: string;
  /** Espaçamento de quem chama — nunca cor nem borda. */
  className?: string;
  /** O nome do destino, como ele aparece na tela: "Painel", "Enviar extrato". */
  children: React.ReactNode;
}) {
  return (
    <Link
      href={para}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-card border border-border2 bg-card px-4",
        "font-mono text-2xs font-bold tracking-wider text-text uppercase",
        "pressiona hover:bg-card2",
        className,
      )}
    >
      <span aria-hidden="true">←</span>
      <span className="sr-only">Voltar para </span>
      {children}
    </Link>
  );
}
