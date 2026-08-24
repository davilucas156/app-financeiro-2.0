"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  avisoDeApagar,
  type DestinoDoApagar,
} from "@/features/categorias/apagar-categoria/aviso";
import { FormularioDeCategoria } from "@/features/categorias/nomear-categoria/FormularioDeCategoria";
import {
  oQueDependeDela,
  podeMover,
  type CategoriaNaGestao,
  type GrupoDeGestao,
  type PoteNaGestao,
} from "./categoriasNaTela";

/**
 * Uma categoria, em quatro modos (tarefa C1).
 *
 * Vendo, renomeando, movendo, apagando — a forma do `CartaoDaRegra` da D9, que
 * já provou caber em 360px.
 *
 * ⛔ **Protótipo: nada aqui grava.** A fase D liga cada botão.
 */

type Modo = "vendo" | "renomeando" | "movendo" | "apagando";

const NAO_LIGADO = "A fase D liga isto. Por enquanto o botão só mostra a forma.";

export function CartaoDaCategoria({
  categoria,
  pote,
  grupos,
}: {
  categoria: CategoriaNaGestao;
  pote: PoteNaGestao;
  /** Todos os potes e categorias — para os destinos de mover e de apagar. */
  grupos: GrupoDeGestao[];
}) {
  const [modo, setModo] = useState<Modo>("vendo");
  const nunca = categoria.lancamentos === 0 && categoria.regras === 0;

  return (
    <Card className="mt-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-sm font-bold break-words text-text">
          {categoria.emoji} {categoria.nome}
        </span>
        <span
          className={`shrink-0 font-mono text-[10px] ${nunca ? "text-dim2" : "text-dim"}`}
        >
          {oQueDependeDela(categoria)}
        </span>
      </div>

      {modo === "vendo" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Secundario onClick={() => setModo("renomeando")}>Renomear</Secundario>

          {/*
            ⚠ **Mover só quando vazia** (B2, descoberta 4). A tela não esconde o
            motivo: sem o botão, uma linha explica por quê — senão a pessoa
            procuraria um botão que viu ontem.
          */}
          {podeMover(categoria) && (
            <Secundario onClick={() => setModo("movendo")}>
              Mover de pote
            </Secundario>
          )}

          <Secundario onClick={() => setModo("apagando")}>Apagar</Secundario>
        </div>
      )}

      {modo === "vendo" && !podeMover(categoria) && (
        <p className="mt-2 text-[11px] leading-relaxed text-dim2">
          Não dá para mover de pote com lançamento dentro: isso mudaria o rateio
          de todos os meses anteriores de uma vez.
        </p>
      )}

      {modo === "renomeando" && (
        <FormularioDeCategoria
          inicial={{ nome: categoria.nome, emoji: categoria.emoji }}
          aoSalvar={() => setModo("vendo")}
          aoCancelar={() => setModo("vendo")}
          rotuloDoBotao="Salvar"
          aindaNaoLigado={NAO_LIGADO}
        />
      )}

      {modo === "movendo" && (
        <Mudanca
          pote={pote}
          grupos={grupos}
          aoCancelar={() => setModo("vendo")}
        />
      )}

      {modo === "apagando" && (
        <Exclusao
          categoria={categoria}
          pote={pote}
          grupos={grupos}
          aoCancelar={() => setModo("vendo")}
        />
      )}
    </Card>
  );
}

/** Mover de pote — só chega aqui quem está vazia. */
function Mudanca({
  pote,
  grupos,
  aoCancelar,
}: {
  pote: PoteNaGestao;
  grupos: GrupoDeGestao[];
  aoCancelar: () => void;
}) {
  const [destino, setDestino] = useState(pote.id);

  return (
    <div className="mt-4 border-t border-border pt-4">
      <label className="block">
        <span className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
          Mover para
        </span>
        <select
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className="mt-1.5 min-h-11 w-full rounded-card border border-border2 bg-bg px-3 text-sm text-text"
        >
          {grupos.map((g) => (
            <option key={g.pote.id} value={g.pote.id}>
              {g.pote.emoji} {g.pote.nome}
              {g.pote.id === pote.id ? " (atual)" : ""}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-2 text-[11px] leading-relaxed text-dim">
        Ela está vazia, então não há passado para reescrever. É por isso que
        mover é permitido agora e deixa de ser assim que o primeiro lançamento
        cair aqui.
      </p>

      <div className="mt-4 flex gap-2">
        <Primario desabilitado>Mover</Primario>
        <Secundario onClick={aoCancelar}>Cancelar</Secundario>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-dim2">{NAO_LIGADO}</p>
    </div>
  );
}

/**
 * Apagar: o raio-X, o destino e o alerta — antes do segundo toque.
 *
 * "Mover para outra categoria" vem pré-selecionado. Decisão do Davi na
 * pendência 2: devolver 12 lançamentos para a fila é trabalho real, e quem
 * escolhe isso deve estar escolhendo de propósito — não por ser o caminho de
 * menor resistência.
 */
function Exclusao({
  categoria,
  pote,
  grupos,
  aoCancelar,
}: {
  categoria: CategoriaNaGestao;
  pote: PoteNaGestao;
  grupos: GrupoDeGestao[];
  aoCancelar: () => void;
}) {
  // As do mesmo pote primeiro — a mesma ordem que o raio-X da B3 devolve.
  const candidatas = [
    ...grupos.filter((g) => g.pote.id === pote.id),
    ...grupos.filter((g) => g.pote.id !== pote.id),
  ].flatMap((g) =>
    g.categorias
      .filter((c) => c.id !== categoria.id)
      .map((c) => ({ categoria: c, pote: g.pote })),
  );

  const [modo, setModo] = useState<"mover" | "revisao">("mover");
  const [paraId, setParaId] = useState(candidatas[0]?.categoria.id ?? "");

  const escolhida = candidatas.find((c) => c.categoria.id === paraId);

  const destino: DestinoDoApagar =
    modo === "mover" && escolhida
      ? {
          tipo: "mover",
          categoria: `${escolhida.categoria.emoji} ${escolhida.categoria.nome}`,
          outroPote: escolhida.pote.id !== pote.id,
        }
      : { tipo: "revisao" };

  // ⚠ A tela não escreve texto de consequência à mão: a frase e o alerta vêm
  // da A3, que é pura e testada.
  const aviso = avisoDeApagar(categoria, destino);

  return (
    <div className="mt-4 rounded-card border border-red/20 bg-red/8 p-4">
      <p className="text-xs font-bold text-red">
        Apagar {categoria.emoji} {categoria.nome}?
      </p>

      {candidatas.length > 0 && (
        <div className="mt-3 space-y-2">
          <Escolha
            marcada={modo === "mover"}
            aoMarcar={() => setModo("mover")}
            rotulo="Mover o que está dentro para outra categoria"
          />
          {modo === "mover" && (
            <select
              value={paraId}
              onChange={(e) => setParaId(e.target.value)}
              aria-label="Categoria de destino"
              className="min-h-11 w-full rounded-card border border-border2 bg-bg px-3 text-sm text-text"
            >
              {candidatas.map(({ categoria: c, pote: p }) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.nome} · {p.nome}
                </option>
              ))}
            </select>
          )}

          <Escolha
            marcada={modo === "revisao"}
            aoMarcar={() => setModo("revisao")}
            rotulo="Devolver para a revisão, sem categoria"
          />
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-dim">{aviso.frase}</p>

      {aviso.alerta && (
        <p className="mt-2 text-xs leading-relaxed text-gold">
          ⚠ {aviso.alerta}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Primario desabilitado>Apagar</Primario>
        <Secundario onClick={aoCancelar}>Manter</Secundario>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-dim2">{NAO_LIGADO}</p>
    </div>
  );
}

function Escolha({
  marcada,
  aoMarcar,
  rotulo,
}: {
  marcada: boolean;
  aoMarcar: () => void;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={aoMarcar}
      aria-pressed={marcada}
      className={`flex min-h-11 w-full items-center gap-2.5 rounded-pote border px-3 py-2 text-left text-xs transition-colors ${
        marcada
          ? "border-primary/50 bg-card text-text"
          : "border-border bg-transparent text-dim hover:bg-card"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-3 shrink-0 rounded-full border ${
          marcada ? "border-primary bg-primary" : "border-border2"
        }`}
      />
      {rotulo}
    </button>
  );
}

function Primario({
  onClick,
  desabilitado = false,
  children,
}: {
  onClick?: () => void;
  desabilitado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-card bg-primary px-4 text-sm font-bold text-bg transition-colors hover:bg-orange disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Secundario({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-card border border-border2 bg-card px-4 text-xs font-bold text-text transition-colors hover:bg-card2"
    >
      {children}
    </button>
  );
}
