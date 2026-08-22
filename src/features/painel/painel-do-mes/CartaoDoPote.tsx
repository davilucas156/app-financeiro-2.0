"use client";

import { useState } from "react";
import { emReais, diaEMes } from "@/lib/dinheiro";
import { metaDoPote } from "@/features/painel/somar-o-mes/meta";
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
}: {
  pote: PoteNoPainel;
  rendaDeclaradaCentavos: number | null;
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

      {aberto && <DentroDoPote pote={pote} />}
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
function DentroDoPote({ pote }: { pote: PoteNoPainel }) {
  return (
    <div className="border-t border-border bg-bg/40 px-4 pb-4">
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
              <span className="font-mono text-[10px] text-dim">
                {diaEMes(l.data)} · {l.categoriaEmoji} {l.categoriaNome}
              </span>

              {/* A D4 é quem liga isto. Mesma decisão do "Voltar" na D4 da spec
                  03: fingir que funciona seria pior do que estar apagado — e no
                  portão o Davi precisa ver onde ele vai ficar. */}
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 items-center rounded-card border border-border2 px-3 text-[10px] font-bold text-text disabled:opacity-40"
              >
                Trocar categoria
              </button>
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
