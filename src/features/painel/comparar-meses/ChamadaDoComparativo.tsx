import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { rotuloDeMes } from "@/lib/mes";
import type { MediaDoComparativo } from "./comparativo";

/**
 * O que ficou no painel no lugar do comparativo (spec 09, tarefa A2).
 *
 * ## Não é só um link, e essa é a decisão
 *
 * "Ver comparativo →" sozinho é um botão que ninguém aperta: ele promete
 * trabalho sem prometer resposta. O que faz alguém tocar é **já ver um pedaço
 * do resultado** — a mesma frase que a tela de destino usa no topo, calculada
 * pela mesma função.
 *
 * ⚠ **A frase vem de `mediaDoComparativo`, que o painel chama com a consulta
 * barata.** Foi por isso que ela virou export próprio: se o painel calculasse
 * "média de 3 meses" por conta e a `/comparativo` calculasse por outra, um dia
 * as duas discordariam e ninguém saberia qual mentiu.
 *
 * ## Com um mês, ela não aparece
 *
 * Convidar para o comparativo quem tem um mês só é convidar para uma tela que
 * vai dizer "ainda não dá para comparar". O painel de quem está começando já
 * tem um destino melhor — o `/upload` —, e ele está logo acima, no aviso de
 * cobertura.
 */
export function ChamadaDoComparativo({
  media,
  mes,
}: {
  media: MediaDoComparativo;
  /** O mês que o painel está mostrando. */
  mes: string;
}) {
  if (!media.pode) return null;

  return (
    <Card className="mt-8 p-0">
      <Link
        href="/comparativo"
        className="flex min-h-11 items-center gap-3 px-4 py-4 transition-colors hover:bg-card2"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
            Comparativo
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-text">
            {rotuloDeMes(mes)} {media.frase}, pote a pote.
          </span>
        </span>

        <span aria-hidden="true" className="shrink-0 text-sm text-primary">
          →
        </span>
      </Link>
    </Card>
  );
}
