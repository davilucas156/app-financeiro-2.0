"use client";

import { useState } from "react";
import type { PoteNaGestao } from "@/features/categorias/gerir-categorias/categoriasNaTela";
import { validarCategoria } from "./validar";

/**
 * Nome, emoji e pote — o mesmo formulário nas duas telas (tarefas C1 e C2).
 *
 * ## Um componente, dois lugares
 *
 * `/categorias` é arrumação: você já sabe o que quer mudar. O "+ Nova
 * categoria" da revisão é urgência: você está olhando um lançamento que não
 * cabe em nada.
 *
 * Um nome, um emoji e um pote não mudam de significado por causa de onde você
 * está — e duas cópias divergiriam na primeira vez que a validação mudasse.
 *
 * ## A validação é a mesma da A2, aqui e no servidor
 *
 * A mensagem aparece enquanto se digita e o botão fica apagado até valer.
 * Nenhuma regra nova mora aqui: se a tela aceitasse o que o servidor recusa —
 * ou pior, o contrário — a diferença viveria numa segunda cópia da regra.
 */

/**
 * Uns poucos sugeridos, e não um seletor.
 *
 * A spec decidiu: um seletor completo é uma biblioteca inteira para um campo.
 * Estes cobrem o que costuma faltar num extrato brasileiro sem tentar cobrir
 * tudo — o campo continua aceitando qualquer emoji digitado.
 */
const SUGERIDOS = ["🍔", "🚗", "🏠", "💊", "🎁", "📚", "🐶", "✈️", "🔧", "💡"];

export type ValoresDaCategoria = { nome: string; emoji: string; poteId: string };

export function FormularioDeCategoria({
  inicial,
  potes,
  aoSalvar,
  aoCancelar,
  salvando = false,
  erro = null,
  rotuloDoBotao,
  /**
   * O botão que gravaria, apagado com o motivo.
   *
   * Mesma decisão do "Voltar" na D4 da spec 03 e do "Trocar categoria" na B3
   * da spec 04: no portão visual dá para ver a forma inteira, e fingir que
   * funciona seria pior do que estar apagado.
   */
  aindaNaoLigado = null,
}: {
  inicial?: Partial<ValoresDaCategoria>;
  /** Ausente = o pote não se escolhe aqui (renomear não muda de pote). */
  potes?: PoteNaGestao[];
  aoSalvar: (v: ValoresDaCategoria) => void;
  aoCancelar: () => void;
  salvando?: boolean;
  erro?: string | null;
  rotuloDoBotao: string;
  aindaNaoLigado?: string | null;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [emoji, setEmoji] = useState(inicial?.emoji ?? "");
  const [poteId, setPoteId] = useState(
    inicial?.poteId ?? potes?.[0]?.id ?? "",
  );

  const valida = validarCategoria({ nome, emoji });
  // Em branco não é erro, é ainda-não-preenchido: a mensagem só aparece
  // depois de haver o que criticar.
  const problema =
    !valida.ok && (nome.trim() !== "" || emoji.trim() !== "")
      ? valida.mensagem
      : null;

  const pronto = valida.ok && (potes === undefined || poteId !== "");
  const travado = salvando || aindaNaoLigado !== null;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex gap-2">
        <label className="w-16 shrink-0">
          <span className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
            Emoji
          </span>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            disabled={salvando}
            aria-label="Emoji da categoria"
            className="mt-1.5 min-h-11 w-full rounded-card border border-border2 bg-bg px-2 text-center text-lg text-text disabled:opacity-40"
          />
        </label>

        <label className="min-w-0 flex-1">
          <span className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
            Nome
          </span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={salvando}
            placeholder="Gasolina"
            autoFocus
            className="mt-1.5 min-h-11 w-full rounded-card border border-border2 bg-bg px-3 text-sm text-text placeholder:text-dim2 disabled:opacity-40"
          />
        </label>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGERIDOS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setEmoji(s)}
            disabled={salvando}
            aria-label={`Usar o emoji ${s}`}
            className="inline-flex size-11 items-center justify-center rounded-pote border border-border bg-card text-base transition-colors hover:bg-card2 disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      {potes && (
        <label className="mt-3 block">
          <span className="font-mono text-[9px] font-bold tracking-[1.5px] text-dim uppercase">
            No pote
          </span>
          {/*
            ⚠ **Os nove potes, renda incluída** — mesma decisão da C2 da spec 03
            em `agruparPorPote`. Um Pix recebido precisa de destino, e esconder
            renda tornaria toda entrada impossível de classificar.
          */}
          <select
            value={poteId}
            onChange={(e) => setPoteId(e.target.value)}
            disabled={salvando}
            className="mt-1.5 min-h-11 w-full rounded-card border border-border2 bg-bg px-3 text-sm text-text disabled:opacity-40"
          >
            {potes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.nome}
              </option>
            ))}
          </select>
          <span className="mt-1.5 block text-[11px] leading-relaxed text-dim">
            Pote é obrigatório: categoria fora de pote não entra em rateio
            nenhum, e um gasto que não cai em pote é um gasto que o painel não
            conta.
          </span>
        </label>
      )}

      {problema && (
        <p className="mt-3 text-[11px] leading-relaxed text-gold">{problema}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => valida.ok && aoSalvar({ nome: valida.nome, emoji: valida.emoji, poteId })}
          disabled={!pronto || travado}
          aria-busy={salvando || undefined}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-card bg-primary px-4 text-sm font-bold text-bg transition-colors hover:bg-orange disabled:cursor-not-allowed disabled:opacity-40"
        >
          {rotuloDoBotao}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          disabled={salvando}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-card border border-border2 bg-card px-4 text-xs font-bold text-text transition-colors hover:bg-card2 disabled:opacity-40"
        >
          Cancelar
        </button>
      </div>

      {aindaNaoLigado && (
        <p className="mt-2 text-[11px] leading-relaxed text-dim2">
          {aindaNaoLigado}
        </p>
      )}

      {erro && (
        <p role="alert" className="mt-2 text-[11px] leading-relaxed text-red">
          {erro}
        </p>
      )}
    </div>
  );
}
