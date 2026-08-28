"use client";

import { useState, useTransition } from "react";
import { salvarMeta } from "./definirMeta.action";
import { lerPercentual, paraOCampo } from "./percentual";

/**
 * A meta do pote, na tela e editável (tarefas C1 e C2).
 *
 * ## O gesto é o do `CampoDeRenda`, de propósito
 *
 * Tocar no número abre o editor; salvar fecha. As duas coisas que definem uma
 * meta — a **renda** e o **rateio** — passam a se editar do mesmo jeito, e é
 * isso que faz parecerem a mesma ideia, que é o que elas são.
 *
 * ## Vazio é uma resposta
 *
 * Apagar o campo tira a meta do pote. Como campo vazio que salva algo é
 * surpresa, o editor **diz isso antes**, na linha da prévia, e a prévia muda
 * enquanto a pessoa digita.
 *
 * ⚠ **A frase do retroativo mora aqui**, e não num rodapé: a meta é calculada
 * e não guardada, então mudar o percentual hoje re-julga março. Quem está
 * prestes a salvar é quem precisa saber disso.
 */
export function CampoDeMeta({
  poteId,
  percentual,
}: {
  poteId: string;
  percentual: number | null;
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <Editor
        poteId={poteId}
        percentual={percentual}
        aoFechar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-card px-4 py-2.5">
      <div className="min-w-0">
        <p className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
          Meta do pote
        </p>
        <p className="mt-0.5 font-mono text-sm text-text">
          {percentual === null ? (
            "sem meta"
          ) : (
            <>
              {percentual}%{" "}
              <span className="text-2xs text-dim">da renda do mês</span>
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setEditando(true)}
        className="inline-flex min-h-11 shrink-0 items-center rounded-card border border-border2 bg-card px-4 text-xs font-bold text-text transition-colors hover:bg-card2"
      >
        {percentual === null ? "Definir" : "Mudar"}
      </button>
    </div>
  );
}

function Editor({
  poteId,
  percentual,
  aoFechar,
}: {
  poteId: string;
  percentual: number | null;
  aoFechar: () => void;
}) {
  const [texto, setTexto] = useState(paraOCampo(percentual));
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  // A mesma função que o servidor vai chamar. O cliente a usa para responder
  // rápido; o servidor, porque é ele quem grava.
  const lido = lerPercentual(texto);

  const salvar = () =>
    iniciar(async () => {
      setErro(null);

      const r = await salvarMeta(poteId, texto);
      if (r.ok) aoFechar();
      else setErro(r.erro);
    });

  return (
    <div className="mt-2 rounded-card border border-primary/30 bg-card px-4 py-3">
      <label className="block">
        <span className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
          Meta do pote
        </span>
        <div className="mt-1.5 flex items-center gap-2 rounded-card border border-border2 bg-bg px-3">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={salvando}
            /*
             * `inputMode` e não `type="number"`: o teclado numérico do celular
             * sem o spinner e sem o parse do navegador. `numeric` e não
             * `decimal` — percentual aqui é inteiro, e o campo não deve nem
             * oferecer a vírgula que `lerPercentual` vai recusar.
             */
            inputMode="numeric"
            autoFocus
            className="min-h-11 w-full bg-transparent font-mono text-lg text-text outline-none disabled:opacity-40"
          />
          <span className="font-mono text-sm text-dim">%</span>
        </div>
      </label>

      {/*
        A prévia diz o que vai acontecer, e muda enquanto se digita. É onde a
        pessoa descobre que apagar tem consequência — antes de apagar.
      */}
      <p className="mt-2 text-2xs leading-relaxed text-dim">
        {!lido.ok ? (
          <span className="text-red">{lido.mensagem}</span>
        ) : lido.percentual === null ? (
          "Vazio tira a meta: este pote sai do julgamento e o painel deixa de dizer se estourou."
        ) : (
          <>
            Vira <span className="font-bold text-text">{lido.percentual}%</span>{" "}
            da renda do mês — e vale para todos os meses, inclusive os já
            importados.
          </>
        )}
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || !lido.ok}
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
        <p role="alert" className="mt-2 text-2xs leading-relaxed text-red">
          {erro}
        </p>
      )}
    </div>
  );
}
