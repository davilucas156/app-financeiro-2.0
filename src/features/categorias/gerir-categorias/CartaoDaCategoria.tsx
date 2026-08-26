"use client";

import { useEffect, useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import {
  avisoDeApagar,
  type DestinoDoApagar,
} from "@/features/categorias/apagar-categoria/aviso";
import type { RaioXDaCategoria } from "@/features/categorias/apagar-categoria/raioX.service";
import { FormularioDeCategoria } from "@/features/categorias/nomear-categoria/FormularioDeCategoria";
import {
  apagar,
  mover,
  renomear,
  verOQueVaiJunto,
} from "./gerirCategorias.action";
import {
  oQueDependeDela,
  podeMover,
  type CategoriaNaGestao,
  type PoteNaGestao,
} from "./categoriasNaTela";

/**
 * Uma categoria, em quatro modos (tarefas C1 e D1).
 *
 * Vendo, renomeando, movendo, apagando — a forma do `CartaoDaRegra` da D9, que
 * já provou caber em 360px.
 *
 * A D1 ligou os três botões nas operações da fase B. Cada modo fecha sozinho
 * quando dá certo: quem revalida é a action, e a lista chega nova de cima.
 */

type Modo = "vendo" | "renomeando" | "movendo" | "apagando";

export function CartaoDaCategoria({
  categoria,
  pote,
  potes,
}: {
  categoria: CategoriaNaGestao;
  pote: PoteNaGestao;
  /** Todos os potes — o destino de mover. */
  potes: PoteNaGestao[];
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
          className={`shrink-0 font-mono text-3xs ${nunca ? "text-dim2" : "text-dim"}`}
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
        <p className="mt-2 text-2xs leading-relaxed text-dim2">
          Não dá para mover de pote com lançamento dentro: isso mudaria o rateio
          de todos os meses anteriores de uma vez.
        </p>
      )}

      {modo === "renomeando" && (
        <Renome categoria={categoria} aoFechar={() => setModo("vendo")} />
      )}

      {modo === "movendo" && (
        <Mudanca
          categoria={categoria}
          pote={pote}
          potes={potes}
          aoFechar={() => setModo("vendo")}
        />
      )}

      {modo === "apagando" && (
        <Exclusao
          categoria={categoria}
          pote={pote}
          aoFechar={() => setModo("vendo")}
        />
      )}
    </Card>
  );
}

/**
 * Renomear — o slug fica onde está (B2).
 *
 * O servidor devolve `campo` junto com o erro e a tela não o usa: o formulário
 * tem um lugar só para erro, embaixo. Pintar o campo culpado exigiria a mesma
 * frase em dois lugares.
 */
function Renome({
  categoria,
  aoFechar,
}: {
  categoria: CategoriaNaGestao;
  aoFechar: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, comecar] = useTransition();

  return (
    <FormularioDeCategoria
      inicial={{ nome: categoria.nome, emoji: categoria.emoji }}
      aoSalvar={(v) =>
        comecar(async () => {
          const r = await renomear(categoria.id, {
            nome: v.nome,
            emoji: v.emoji,
          });
          if (r.ok) aoFechar();
          else setErro(r.erro);
        })
      }
      aoCancelar={aoFechar}
      salvando={salvando}
      erro={erro}
      rotuloDoBotao="Salvar"
    />
  );
}

/** Mover de pote — só chega aqui quem está vazia. */
function Mudanca({
  categoria,
  pote,
  potes,
  aoFechar,
}: {
  categoria: CategoriaNaGestao;
  pote: PoteNaGestao;
  potes: PoteNaGestao[];
  aoFechar: () => void;
}) {
  const [destino, setDestino] = useState(pote.id);
  const [erro, setErro] = useState<string | null>(null);
  const [movendo, comecar] = useTransition();

  return (
    <div className="mt-4 border-t border-border pt-4">
      <label className="block">
        <span className="font-mono text-4xs font-bold tracking-[1.5px] text-dim uppercase">
          Mover para
        </span>
        <select
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          disabled={movendo}
          className="mt-1.5 min-h-11 w-full rounded-card border border-border2 bg-bg px-3 text-sm text-text disabled:opacity-40"
        >
          {potes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.nome}
              {p.id === pote.id ? " (atual)" : ""}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-2 text-2xs leading-relaxed text-dim">
        Ela está vazia, então não há passado para reescrever. É por isso que
        mover é permitido agora e deixa de ser assim que o primeiro lançamento
        cair aqui.
      </p>

      <div className="mt-4 flex gap-2">
        <Primario
          desabilitado={movendo}
          onClick={() =>
            comecar(async () => {
              const r = await mover(categoria.id, destino);
              if (r.ok) aoFechar();
              else setErro(r.erro);
            })
          }
        >
          {movendo ? "Movendo…" : "Mover"}
        </Primario>
        <Secundario onClick={aoFechar}>Cancelar</Secundario>
      </div>

      {erro && (
        <p role="alert" className="mt-2 text-2xs leading-relaxed text-red">
          {erro}
        </p>
      )}
    </div>
  );
}

/**
 * Apagar: o raio-X, o destino e o alerta — antes do segundo toque.
 *
 * ## Os números são relidos aqui, e não herdados da listagem
 *
 * Seria de graça reusar o que o cartão já mostra. Só que a listagem foi
 * renderizada quando a página abriu, e apagar acontece depois e não tem volta:
 * se um extrato entrou nesse meio-tempo, a tela diria "nunca foi usada" e o
 * toque desclassificaria trinta lançamentos em silêncio. A transação da B4
 * ainda faria a coisa certa com eles — mas o **aviso** teria mentido, e o aviso
 * é a única defesa que esta operação tem.
 *
 * Um round-trip a mais num toque que a pessoa dá de propósito. Ele traz junto
 * os destinos já ordenados pelo servidor: duas listas com a mesma regra de
 * ordenação divergiriam.
 *
 * ## "Mover para outra categoria" vem pré-selecionado
 *
 * Decisão do Davi na pendência 2: devolver 12 lançamentos para a fila é
 * trabalho real, e quem escolhe isso deve estar escolhendo de propósito — não
 * por ser o caminho de menor resistência.
 */
function Exclusao({
  categoria,
  pote,
  aoFechar,
}: {
  categoria: CategoriaNaGestao;
  pote: PoteNaGestao;
  aoFechar: () => void;
}) {
  const [raioX, setRaioX] = useState<RaioXDaCategoria | null>(null);
  const [sumiu, setSumiu] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modo, setModo] = useState<"mover" | "revisao">("mover");
  const [paraId, setParaId] = useState("");
  const [apagando, comecar] = useTransition();

  useEffect(() => {
    let vivo = true;

    verOQueVaiJunto(categoria.id).then((r) => {
      if (!vivo) return;
      if (!r) {
        setSumiu(true);
        return;
      }
      setRaioX(r);
      setParaId(r.destinos[0]?.id ?? "");
    });

    return () => {
      vivo = false;
    };
  }, [categoria.id]);

  if (sumiu) {
    return (
      <Moldura>
        <p className="text-xs leading-relaxed text-dim">
          Essa categoria não existe mais. Recarregue a tela.
        </p>
      </Moldura>
    );
  }

  if (!raioX) {
    return (
      <Moldura>
        <p className="text-xs leading-relaxed text-dim">
          Conferindo o que está dentro dela…
        </p>
      </Moldura>
    );
  }

  const escolhida = raioX.destinos.find((d) => d.id === paraId);
  const movendoPara = modo === "mover" && escolhida ? escolhida : null;

  const destino: DestinoDoApagar = movendoPara
    ? {
        tipo: "mover",
        categoria: `${movendoPara.emoji} ${movendoPara.nome}`,
        outroPote: movendoPara.pote.id !== pote.id,
      }
    : { tipo: "revisao" };

  // ⚠ A tela não escreve texto de consequência à mão: a frase e o alerta vêm
  // da A3, que é pura e testada.
  const aviso = avisoDeApagar(raioX.dentro, destino);

  return (
    <Moldura>
      <p className="text-xs font-bold text-red">
        Apagar {categoria.emoji} {categoria.nome}?
      </p>

      {raioX.destinos.length > 0 && (
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
              disabled={apagando}
              aria-label="Categoria de destino"
              className="min-h-11 w-full rounded-card border border-border2 bg-bg px-3 text-sm text-text disabled:opacity-40"
            >
              {raioX.destinos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.emoji} {d.nome} · {d.pote.nome}
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
        <Primario
          desabilitado={apagando}
          onClick={() =>
            comecar(async () => {
              const r = await apagar(
                categoria.id,
                movendoPara
                  ? { tipo: "mover", categoriaId: movendoPara.id }
                  : { tipo: "revisao" },
              );
              if (r.ok) aoFechar();
              else setErro(r.erro);
            })
          }
        >
          {apagando ? "Apagando…" : "Apagar"}
        </Primario>
        <Secundario onClick={aoFechar}>Manter</Secundario>
      </div>

      {erro && (
        <p role="alert" className="mt-2 text-2xs leading-relaxed text-red">
          {erro}
        </p>
      )}
    </Moldura>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-card border border-red/20 bg-red/8 p-4">
      {children}
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
      aria-busy={desabilitado || undefined}
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
