"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { FormularioDeCategoria } from "@/features/categorias/nomear-categoria/FormularioDeCategoria";
import { CartaoDaCategoria } from "./CartaoDaCategoria";
import {
  agruparParaGerir,
  type CategoriaNaGestao,
  type PoteNaGestao,
} from "./categoriasNaTela";

/**
 * `/categorias` — a tela de arrumação (tarefa C1).
 *
 * ## Os nove potes aparecem, inclusive os vazios
 *
 * É a B5 do outro lado. Se a tela derivasse os potes das categorias, o pote sem
 * categoria nenhuma sumiria — e sumiria **exatamente da única tela onde daria
 * para criar uma categoria dentro dele**. Ficaria inalcançável para sempre.
 *
 * ## O "+ Nova categoria" fica no fim de cada pote
 *
 * Criar categoria é fácil e barato, e uma conta com 60 categorias tem um painel
 * que não diz nada — o método dos potes funciona porque a lista cabe na cabeça.
 * A tela não impede; ela faz você passar por todas as que já existem primeiro.
 */
export function TelaDeCategorias({
  potes,
  categorias,
  prototipo = false,
}: {
  potes: PoteNaGestao[];
  categorias: CategoriaNaGestao[];
  /** Enquanto a fase D não liga a gravação. */
  prototipo?: boolean;
}) {
  const grupos = agruparParaGerir(potes, categorias);

  return (
    <>
      <SectionTitle>Categorias</SectionTitle>

      {prototipo && (
        <Card className="border-gold/30 bg-gold/8">
          <p className="text-xs leading-relaxed text-dim">
            <strong className="font-bold text-gold">
              Protótipo — estas categorias são inventadas.
            </strong>{" "}
            Nada aqui grava, e os números não são os da sua conta. É para você
            olhar a forma antes de eu ligar os botões.
          </p>
        </Card>
      )}

      <Card className="mt-3 border-blue/20 bg-blue/8">
        <p className="text-xs leading-relaxed text-dim">
          <strong className="font-bold text-blue">
            {categorias.length} categorias em {potes.length} potes.
          </strong>{" "}
          Renomear muda só o rótulo. Apagar pede um destino para o que estava
          dentro — e leva as regras junto, para o motor não parar em silêncio.
        </p>
      </Card>

      {grupos.map(({ pote, categorias: doPote }) => (
        <section key={pote.id} className="mt-6">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: pote.cor }}
            />
            <h2 className="font-mono text-[10px] font-bold tracking-[1.5px] text-dim uppercase">
              {pote.emoji} {pote.nome}
            </h2>
            <span className="font-mono text-[10px] text-dim2">
              {doPote.length === 0
                ? "sem categoria"
                : doPote.length === 1
                  ? "1 categoria"
                  : `${doPote.length} categorias`}
            </span>
          </div>

          {doPote.map((categoria) => (
            <CartaoDaCategoria
              key={categoria.id}
              categoria={categoria}
              pote={pote}
              grupos={grupos}
            />
          ))}

          <NovaCategoria pote={pote} potes={potes} />
        </section>
      ))}

      <p className="mt-8 text-[11px] leading-relaxed text-dim">
        Não dá para criar ou apagar pote aqui, e é de propósito: os potes são a
        espinha do método e os percentuais somam 100% — criar um mexe no rateio
        de todos os outros. Isso é item próprio da fase 2.{" "}
        <Link href="/regras" className="underline underline-offset-4">
          As regras
        </Link>{" "}
        moram em outra tela.
      </p>
    </>
  );
}

function NovaCategoria({
  pote,
  potes,
}: {
  pote: PoteNaGestao;
  potes: PoteNaGestao[];
}) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-card border border-dashed border-border2 px-4 text-xs font-bold text-dim transition-colors hover:bg-card"
      >
        + Nova categoria em {pote.nome}
      </button>
    );
  }

  return (
    <Card className="mt-2">
      <FormularioDeCategoria
        inicial={{ poteId: pote.id }}
        potes={potes}
        aoSalvar={() => setAberto(false)}
        aoCancelar={() => setAberto(false)}
        rotuloDoBotao="Criar"
        aindaNaoLigado="A fase D liga isto. Por enquanto o botão só mostra a forma."
      />
    </Card>
  );
}
