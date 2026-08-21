"use client";

import { useMemo, useState } from "react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";
import { CATEGORIAS_ESCOLHIVEIS, chaveDe, potesNaOrdem } from "./categorias";

/**
 * ⚠ **Não é o `normalizarDescricao` do motor**, e não é descuido.
 *
 * Aquele mora em `ler-arquivo/preparar.ts`, que importa `node:crypto` para a
 * impressão digital — puxá-lo para um componente de cliente quebraria o build.
 *
 * E os propósitos são diferentes: lá é comparação de regra, que precisa ser
 * idêntica à que gravou a regra; aqui é filtro de busca de tela, onde caixa
 * baixa basta.
 */
const comparavel = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * A lista completa, agrupada por pote (tarefa B2).
 *
 * ## Ela é o caminho principal, e não o de exceção
 *
 * A A6 mediu o motor real contra o primeiro mês do Davi: **só 2 dos 17**
 * pendentes recebem sugestão. Os outros 15 chegam aqui.
 *
 * Por isso ela nasce **aberta**, e não como um `<details>` no rodapé. A spec
 * dizia "recolhida por padrão"; a medição desmentiu, e quem manda é a medição.
 *
 * A partir do segundo mês a proporção se inverte, porque o histórico passa a
 * existir. Mas é o primeiro mês que decide se o app continua sendo usado.
 *
 * ## A busca filtra de verdade
 *
 * São 22 categorias em 8 potes — a spec pedia busca a partir de ~20. Num
 * protótipo visual, filtro que não filtra não dá para julgar: o que se está
 * avaliando aqui é justamente quanto polegar custa achar uma categoria.
 */
export function ListaDeCategorias({ direcao }: { direcao: Direcao }) {
  const [busca, setBusca] = useState("");

  const encontradas = useMemo(() => {
    const alvo = comparavel(busca);
    if (!alvo) return null;

    return CATEGORIAS_ESCOLHIVEIS.filter(
      (c) =>
        comparavel(c.nome).includes(alvo) ||
        comparavel(c.pote.nome).includes(alvo),
    );
  }, [busca]);

  return (
    <section aria-labelledby="todas-as-categorias">
      <SectionTitle>
        <span id="todas-as-categorias">Escolher categoria</span>
      </SectionTitle>

      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar categoria ou pote"
        aria-label="Buscar categoria"
        className="min-h-11 w-full rounded-card border border-border2 bg-card px-4 text-sm text-text placeholder:text-dim2 focus:border-primary focus:outline-none"
      />

      {encontradas ? (
        encontradas.length === 0 ? (
          <p className="mt-4 text-xs text-dim">
            Nada com esse nome. Limpe a busca para ver os 8 potes — ou marque
            como fora do cálculo, ali embaixo.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {encontradas.map((c) => (
              <li key={c.chave}>
                <BotaoDeCategoria
                  emoji={c.emoji}
                  nome={c.nome}
                  cor={c.pote.classeCor}
                  pote={c.pote.nome}
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="mt-3 space-y-5">
          {potesNaOrdem(direcao).map((pote) => (
            <div key={pote.slug}>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${pote.classeCor}`}
                />
                <h3 className="font-mono text-[10px] font-bold tracking-[1.5px] text-dim uppercase">
                  {pote.emoji} {pote.nome}
                </h3>
              </div>

              <ul className="mt-2 space-y-2">
                {pote.categorias.map((c) => (
                  <li key={chaveDe(pote, c)}>
                    <BotaoDeCategoria
                      emoji={c.emoji}
                      nome={c.nome}
                      cor={pote.classeCor}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Uma coluna só, 44px de altura: em 360px dois por linha viram alvo de agulha. */
function BotaoDeCategoria({
  emoji,
  nome,
  cor,
  pote,
}: {
  emoji: string;
  nome: string;
  cor: string;
  pote?: string;
}) {
  return (
    <button
      type="button"
      className="flex min-h-11 w-full items-center gap-3 rounded-pote border border-border bg-card px-4 py-2.5 text-left transition-colors hover:border-border2 hover:bg-card2"
    >
      <span aria-hidden="true" className={`h-6 w-0.5 shrink-0 rounded-full ${cor}`} />
      <span className="min-w-0 flex-1 truncate text-sm text-text">
        {emoji} {nome}
      </span>
      {pote && (
        <span className="shrink-0 font-mono text-[9px] tracking-[1px] text-dim2 uppercase">
          {pote}
        </span>
      )}
    </button>
  );
}
