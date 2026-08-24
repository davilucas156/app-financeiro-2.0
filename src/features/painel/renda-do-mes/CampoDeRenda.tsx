"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { emReais } from "@/lib/dinheiro";
import { rotuloDeMes } from "@/lib/mes";
import { informarRenda } from "./declararRenda.action";
import { emCentavos, paraOCampo } from "./emCentavos";
import type { RendaDeclarada } from "./rendaDeclarada";

/**
 * A régua das metas, na tela e editável (tarefa D2).
 *
 * ## Por que ela fica visível, e não numa tela de configuração
 *
 * Herdar do mês anterior é conveniente e tem um custo, que a spec nomeou: seis
 * meses depois de um aumento, as metas continuariam calculadas sobre o salário
 * antigo e ninguém teria avisado.
 *
 * Mostrar o número — e **de onde ele veio** — é a defesa mais barata que
 * existe. "R$ 1.200 · herdada de junho" faz a pergunta sozinha.
 *
 * ## O valor sugerido não é invenção minha
 *
 * R$ 1.200 é a base do painel HTML do próprio Davi: é o número que produz
 * exatamente os 360/300/180/180/120/60 já versionados em `potes-padrao.ts`.
 * Sugerido e **visível no campo**, nunca aplicado em silêncio.
 */

/** A base que gera as metas de referência do painel original. */
const SUGERIDA_CENTAVOS = 120_000;

export function CampoDeRenda({
  mes,
  renda,
}: {
  mes: string;
  renda: RendaDeclarada | null;
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <Editor
        mes={mes}
        inicial={renda?.centavos ?? SUGERIDA_CENTAVOS}
        aoFechar={() => setEditando(false)}
      />
    );
  }

  return (
    <Card className="mt-3 border-border2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
            Renda do mês
          </p>
          <p className="mt-1 font-mono text-lg font-medium text-text">
            {renda === null ? "não informada" : emReais(renda.centavos)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditando(true)}
          className="inline-flex min-h-11 items-center rounded-card border border-border2 bg-card px-4 text-xs font-bold text-text transition-colors hover:bg-card2"
        >
          {renda === null ? "Informar" : "Editar"}
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-dim">
        {renda === null ? (
          "Sem ela não dá para calcular meta nenhuma — e inventar uma base seria inventar a sua renda. Os potes abaixo mostram o gasto sem barra."
        ) : renda.herdada ? (
          <>
            <span className="font-bold text-gold">
              Herdada de {rotuloDeMes(renda.mesDeOrigem)}.
            </span>{" "}
            As metas dos potes são fatias dela. Se sua renda mudou, é aqui que
            se corrige.
          </>
        ) : (
          "As metas dos potes são fatias deste valor. Você informa; o app não adivinha."
        )}
      </p>
    </Card>
  );
}

function Editor({
  mes,
  inicial,
  aoFechar,
}: {
  mes: string;
  inicial: number;
  aoFechar: () => void;
}) {
  const [texto, setTexto] = useState(paraOCampo(inicial));
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  const centavos = emCentavos(texto);

  const salvar = () =>
    iniciar(async () => {
      setErro(null);

      if (centavos === null) {
        setErro("Escreva um valor, como 1.200 ou 1200,50.");
        return;
      }

      const r = await informarRenda({ mes, centavos });
      if (r.ok) aoFechar();
      else setErro(r.erro);
    });

  return (
    <Card className="mt-3 border-primary/30">
      <label className="block">
        <span className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
          Renda de {rotuloDeMes(mes)}
        </span>
        <div className="mt-1.5 flex items-center gap-2 rounded-card border border-border2 bg-bg px-3">
          <span className="font-mono text-sm text-dim">R$</span>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={salvando}
            // `inputMode` e não `type="number"`: o teclado numérico do celular
            // sem o comportamento de spinner e sem o parse do navegador, que
            // não fala vírgula.
            inputMode="decimal"
            autoFocus
            className="min-h-11 w-full bg-transparent font-mono text-lg text-text outline-none disabled:opacity-40"
          />
        </div>
      </label>

      {/* O que você digitou, do jeito que vai ser gravado. Digitar "1.200" e
          ver "R$ 1.200,00" antes de salvar é o que impede o zero a mais de
          passar despercebido. */}
      <p className="mt-2 font-mono text-[11px] text-dim">
        {centavos === null ? "—" : `vira ${emReais(centavos)}`}
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          aria-busy={salvando || undefined}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-card bg-primary px-5 text-sm font-bold text-bg transition-colors hover:bg-orange disabled:cursor-not-allowed disabled:opacity-40"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={aoFechar}
          disabled={salvando}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-card border border-border2 bg-card px-5 text-xs font-bold text-text transition-colors hover:bg-card2 disabled:opacity-40"
        >
          Cancelar
        </button>
      </div>

      {erro && (
        <p role="alert" className="mt-2 text-[11px] leading-relaxed text-red">
          {erro}
        </p>
      )}
    </Card>
  );
}
