"use client";

import { useState } from "react";
import { emReais, diaEMes } from "@/lib/dinheiro";
import type { CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";
import { metaDoPote, type MetaDoPote } from "@/features/painel/somar-o-mes/meta";
import { insightDoPote } from "@/features/painel/veredito-do-mes/insightDoPote";
import { TrocarCategoria } from "@/features/painel/trocar-categoria/TrocarCategoria";
import {
  estadoDoPote,
  legendaDoPote,
  type EstadoDoPote,
  type PoteNoPainel,
} from "./poteNoPainel";

/**
 * Um pote, com barra, e o que há dentro dele (tarefas B2 e B3).
 *
 * ## Os quatro estados têm de se distinguir sem ler o número
 *
 * Vazio, zerado e negativo mostrariam "R$ 0,00" numa tela descuidada, e
 * significam coisas diferentes. Aqui cada um tem cor, barra e legenda próprias
 * — a leitura acontece antes de qualquer número ser processado.
 *
 * ## Expande no lugar, não vira rota
 *
 * Os dados do mês já estão carregados. Uma rota nova custaria proteção no
 * `proxy.ts`, segunda consulta e mais um item para o breadcrumb que não existe.
 * Se a lista crescer a ponto de incomodar, aí vira rota — e aí haverá motivo.
 */
export function CartaoDoPote({
  pote,
  rendaDeclaradaCentavos,
  categorias,
}: {
  pote: PoteNoPainel;
  rendaDeclaradaCentavos: number | null;
  /** Para a troca de categoria da D4, dentro da lista. */
  categorias: CategoriaEscolhivel[];
}) {
  const [aberto, setAberto] = useState(false);

  const meta = metaDoPote({
    percentual: pote.percentual,
    rendaDeclaradaCentavos,
    totalCentavos: pote.totalCentavos,
    lancamentos: pote.lancamentos,
  });

  const estado = estadoDoPote(pote, meta.metaCentavos);
  const cor = CORES[estado];

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        disabled={pote.lancamentos === 0}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors enabled:hover:bg-card2 disabled:cursor-default"
      >
        {/* A cor do pote vem do banco, não de token do Tailwind — a fase 2 vai
            deixar o usuário mudá-la, e a tela tem de continuar refletindo. */}
        <span
          aria-hidden="true"
          className="mt-0.5 h-9 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: pote.cor }}
        />

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-bold break-words">
              {pote.emoji} {pote.nome}
            </span>
            <span className={`shrink-0 font-mono text-sm font-medium ${cor.valor}`}>
              {estado === "vazio" ? "—" : emReais(pote.totalCentavos)}
            </span>
          </span>

          <Barra estado={estado} fracao={meta.fracao} cor={pote.cor} />

          <span className="mt-1.5 flex items-baseline justify-between gap-3">
            <span className={`font-mono text-[10px] ${cor.legenda}`}>
              {legendaDoPote(estado, pote, meta.fracao)}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-dim2">
              {meta.metaCentavos !== null && `meta ${emReais(meta.metaCentavos)}`}
            </span>
          </span>
        </span>
      </button>

      {aberto && (
        <DentroDoPote pote={pote} meta={meta} categorias={categorias} />
      )}
    </div>
  );
}

/**
 * A cor carrega o estado antes do número.
 *
 * Estourado em vermelho **na barra e no número** — decisão do Davi: "numero
 * tambem". É o único sinal da tela que pede ação.
 */
const CORES: Record<EstadoDoPote, { valor: string; legenda: string; barra: string }> = {
  vazio: { valor: "text-dim2", legenda: "text-dim2", barra: "" },
  "sem-meta": { valor: "text-text", legenda: "text-dim", barra: "" },
  negativo: { valor: "text-green", legenda: "text-green", barra: "" },
  estourado: { valor: "text-red", legenda: "text-red", barra: "bg-red" },
  normal: { valor: "text-text", legenda: "text-dim", barra: "" },
};

function Barra({
  estado,
  fracao,
  cor,
}: {
  estado: EstadoDoPote;
  fracao: number | null;
  cor: string;
}) {
  // Sem meta não há barra. `potes-padrao.ts` é explícito: nunca mostrar "0%"
  // num pote que não tem meta — uma barra vazia diria exatamente isso.
  if (fracao === null) return null;

  const largura = Math.min(100, Math.round(fracao * 100));

  return (
    <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-bg">
      <span
        className={`block h-full rounded-full ${estado === "estourado" ? "bg-red" : ""}`}
        style={{
          width: `${largura}%`,
          ...(estado === "estourado" ? {} : { backgroundColor: cor }),
        }}
      />
    </span>
  );
}

/** As categorias e os lançamentos daquele pote (tarefa B3). */
function DentroDoPote({
  pote,
  meta,
  categorias,
}: {
  pote: PoteNoPainel;
  meta: MetaDoPote;
  categorias: CategoriaEscolhivel[];
}) {
  const insight = insightDoPote(pote, meta);

  return (
    <div className="border-t border-border bg-bg/40 px-4 pb-4">
      {/*
        A linha do insight (tarefa B2), antes de tudo o que ela resume.

        ⚠ **Depois de trinta lançamentos ela seria um post-scriptum**, e o
        insight existe justamente para poupar a leitura da lista.

        ⚠ **Pote sem meta não ganha linha nenhuma** — `insightDoPote` devolve
        `null`, e nem o espaço fica. É a descoberta 3 chegando até o pixel:
        silêncio é melhor do que uma frase que divide por zero.
      */}
      {insight !== null && (
        <p className="mt-4 text-xs leading-relaxed text-text">{insight}</p>
      )}

      <p className="mt-4 font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
        Por categoria
      </p>

      <div className="mt-2 space-y-1.5">
        {pote.categorias.map((c) => (
          <div key={c.id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 text-xs break-words text-text">
              {c.emoji} {c.nome}
            </span>
            <span className="shrink-0 font-mono text-xs text-dim">
              {emReais(c.totalCentavos)}
              <span className="ml-2 text-dim2">({c.lancamentos})</span>
            </span>
          </div>
        ))}
      </div>

      <p className="mt-5 font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
        Lançamentos
      </p>

      <div className="mt-2 space-y-2">
        {pote.lista.map((l) => (
          <div
            key={l.id}
            className="rounded-pote border border-border bg-card px-3 py-2.5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-mono text-[11px] break-words text-text">
                {l.descricao}
              </span>
              <span
                className={`shrink-0 font-mono text-xs ${
                  l.direcao === "entrada" ? "text-green" : "text-text"
                }`}
              >
                {l.direcao === "entrada" ? "+" : ""}
                {emReais(l.valorCentavos)}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 font-mono text-[10px] break-words text-dim">
                {diaEMes(l.data)} · {l.categoriaEmoji} {l.categoriaNome}
                {/*
                  ⚠ **A procedência da C3, na tela** (D3).
                  "Por que isso caiu em Lazer?" ganha resposta aqui, seis meses
                  depois — que é a única razão de `classificado_por`,
                  `regra_chave` e `fonte_da_sugestao` existirem. Guardar a
                  resposta num banco que ninguém consulta não responde nada.
                */}
                <span className="block text-dim2">↳ {l.procedencia}</span>
              </span>

              {/* Ligado na D4: o botão esteve apagado desde a B3 porque
                  trocar não existia, e fingir que funcionava seria pior. */}
              <TrocarCategoria lancamento={l} categorias={categorias} />
            </div>

            {l.conferir && (
              <p className="mt-2 text-[10px] leading-relaxed text-gold">
                ⚠ mesmo valor de uma saída deste pote — confira se é reembolso
                ou a mesma transferência aparecendo duas vezes
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
