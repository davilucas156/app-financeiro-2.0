"use client";

import type {
  FonteDeSugestao,
  Sugestao,
} from "@/features/classificacao/motor/sugestoes";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { estiloDoPote } from "@/features/aparencia/tema/estiloDoPote";
import type { CategoriaEscolhivel } from "./categorias";
import { rotuloDaFonte } from "./rotuloDaFonte";

/**
 * Os até 3 botões de sugestão (tarefa B2).
 *
 * ## Cada botão diz de onde veio o palpite
 *
 * Sugestão anônima é palpite que você aceita no escuro. Com a procedência, dá
 * para saber se está confiando em você mesmo do mês passado ou num rótulo do
 * banco que já se provou errado. Uma fonte nova (o LLM, por exemplo) não entra
 * calada: o `Record` de `rotuloDaFonte.ts` obriga a rotulá-la, e o compilador
 * falha até isso ser feito.
 *
 * ## Quando não há sugestão, não há seção
 *
 * A A6 mediu: **15 de 17** pendentes do primeiro mês não recebem sugestão
 * nenhuma. Uma seção vazia dizendo "sem sugestões" só empurraria a lista
 * completa — que é o caminho de verdade — mais para baixo.
 */

export function Sugestoes({
  sugestoes,
  porId,
  aoEscolher,
}: {
  sugestoes: Sugestao[];
  porId: Map<string, CategoriaEscolhivel>;
  aoEscolher: (c: CategoriaEscolhivel, fonte: FonteDeSugestao) => void;
}) {
  if (sugestoes.length === 0) return null;

  return (
    <section aria-labelledby="sugestoes">
      <SectionTitle>
        <span id="sugestoes">Sugestões</span>
      </SectionTitle>

      <ul className="space-y-2">
        {sugestoes.map((s) => {
          const categoria = porId.get(s.categoriaId);
          if (!categoria) return null;

          return (
            <li key={s.categoriaId}>
              <button
                type="button"
                onClick={() => aoEscolher(categoria, s.fonte)}
                className="flex min-h-14 w-full items-center gap-3 rounded-card border border-border2 bg-card px-4 py-3 text-left transition-colors hover:bg-card2"
              >
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={estiloDoPote(categoria.pote.cor)}
                />

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-text">
                    {categoria.emoji} {categoria.nome}
                  </span>
                  <span className="mt-0.5 block truncate text-2xs text-dim">
                    {s.porque}
                  </span>
                </span>

                <span className="shrink-0 font-mono text-4xs tracking-[1px] text-dim uppercase">
                  {rotuloDaFonte(s.fonte)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
