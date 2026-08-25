"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { estiloDoPote } from "@/features/aparencia/tema/estiloDoPote";
import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";
import { agruparPorPote, type CategoriaEscolhivel } from "./categorias";

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
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * A lista completa, agrupada por pote (tarefas B2 e D3).
 *
 * ## Ela é o caminho principal, e não o de exceção
 *
 * A A6 mediu o motor real contra o primeiro mês do Davi: **só 2 dos 17**
 * pendentes recebem sugestão. Os outros 15 chegam aqui.
 *
 * Por isso ela nasce **aberta**, e não como um `<details>` no rodapé. A spec
 * dizia "recolhida por padrão"; a medição desmentiu, e quem manda é a medição.
 *
 * ## As categorias vêm do banco desde a D3
 *
 * Até então saíam de `POTES_PADRAO`, que serve para um protótipo mas guardaria
 * o id errado: o seed é o molde, e o que a D4 grava é o `uuid` da linha da
 * conta. A cor também vem do banco, para a fase 2 poder deixar você mudá-la.
 */
export function ListaDeCategorias({
  categorias,
  direcao,
  aoEscolher,
  atualId,
  titulo = "Escolher categoria",
  rodape,
}: {
  categorias: CategoriaEscolhivel[];
  direcao: Direcao;
  aoEscolher: (c: CategoriaEscolhivel) => void;
  /**
   * A categoria que o lançamento **já tem** (D4 da spec 04).
   *
   * ⚠ Ela aparece marcada e **não é tocável**. Sem isto, abrir a lista para
   * conferir onde o lançamento está e tocar no que já está marcado gravaria
   * uma decisão: `classificado_por` viraria `manual`, `regra_chave` seria
   * apagada e a sombra do desfazer seria sobrescrita — sem nada mudar de
   * lugar na tela.
   *
   * Opcional: na revisão o lançamento não tem categoria escolhida ainda.
   */
  atualId?: string;
  titulo?: string;
  /**
   * O que vem **depois** de todas as categorias (C2 da spec 05).
   *
   * Nomeado, e não um `children` genérico: `children` convidaria qualquer
   * coisa a morar ali, e o lugar tem propósito. O "+ Nova categoria" fica no
   * fim porque criar categoria é fácil e barato, e uma conta com 60 tem um
   * painel que não diz nada — a tela não impede, mas faz você passar por todas
   * as que já existem primeiro.
   */
  rodape?: ReactNode;
}) {
  const [busca, setBusca] = useState("");
  /*
   * ⚠ **O id do título é gerado, e não fixo.** Desde a D4 da spec 04 o painel
   * pode ter mais de uma lista aberta ao mesmo tempo — uma por pote expandido.
   * Um id repetido faria `aria-labelledby` apontar para a lista errada.
   */
  const idDoTitulo = useId();

  const grupos = useMemo(
    () => agruparPorPote(categorias, direcao),
    [categorias, direcao],
  );

  const encontradas = useMemo(() => {
    const alvo = comparavel(busca);
    if (!alvo) return null;

    return categorias.filter(
      (c) =>
        comparavel(c.nome).includes(alvo) ||
        comparavel(c.pote.nome).includes(alvo),
    );
  }, [busca, categorias]);

  return (
    <section aria-labelledby={idDoTitulo}>
      <SectionTitle>
        <span id={idDoTitulo}>{titulo}</span>
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
            Nada com esse nome. Limpe a busca para ver os potes — ou marque como
            fora do cálculo, ali em cima.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {encontradas.map((c) => (
              <li key={c.id}>
                <BotaoDeCategoria
                  categoria={c}
                  aoEscolher={aoEscolher}
                  atual={c.id === atualId}
                  mostrarPote
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="mt-3 space-y-5">
          {grupos.map(({ pote, categorias: doPote }) => (
            <div key={pote.id}>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={estiloDoPote(pote.cor)}
                />
                <h3 className="font-mono text-[10px] font-bold tracking-[1.5px] text-dim uppercase">
                  {pote.emoji} {pote.nome}
                </h3>
              </div>

              <ul className="mt-2 space-y-2">
                {doPote.map((c) => (
                  <li key={c.id}>
                    <BotaoDeCategoria
                      categoria={c}
                      aoEscolher={aoEscolher}
                      atual={c.id === atualId}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Depois da busca também: quem procurou e não achou é justamente quem
          precisa criar. */}
      {rodape && <div className="mt-4">{rodape}</div>}
    </section>
  );
}

/** Uma coluna só, 44px de altura: em 360px dois por linha viram alvo de agulha. */
function BotaoDeCategoria({
  categoria,
  aoEscolher,
  atual = false,
  mostrarPote = false,
}: {
  categoria: CategoriaEscolhivel;
  aoEscolher: (c: CategoriaEscolhivel) => void;
  atual?: boolean;
  mostrarPote?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => aoEscolher(categoria)}
      disabled={atual}
      aria-current={atual || undefined}
      className="flex min-h-11 w-full items-center gap-3 rounded-pote border border-border bg-card px-4 py-2.5 text-left transition-colors enabled:hover:border-border2 enabled:hover:bg-card2 disabled:cursor-default disabled:border-border2 disabled:bg-card2"
    >
      <span
        aria-hidden="true"
        className="h-6 w-0.5 shrink-0 rounded-full"
        style={estiloDoPote(categoria.pote.cor)}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-text">
        {categoria.emoji} {categoria.nome}
      </span>
      {atual ? (
        <span className="shrink-0 font-mono text-[9px] font-bold tracking-[1px] text-primary uppercase">
          atual
        </span>
      ) : (
        mostrarPote && (
          <span className="shrink-0 font-mono text-[9px] tracking-[1px] text-dim2 uppercase">
            {categoria.pote.nome}
          </span>
        )
      )}
    </button>
  );
}
