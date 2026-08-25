"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { estiloDoPote } from "@/features/aparencia/tema/estiloDoPote";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { FormularioDeCategoria } from "@/features/categorias/nomear-categoria/FormularioDeCategoria";
import { CartaoDaCategoria } from "./CartaoDaCategoria";
import { criar } from "./gerirCategorias.action";
import {
  agruparParaGerir,
  type CategoriaNaGestao,
  type PoteNaGestao,
} from "./categoriasNaTela";

/**
 * `/categorias` — a tela de arrumação (tarefas C1 e D1).
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
}: {
  potes: PoteNaGestao[];
  categorias: CategoriaNaGestao[];
}) {
  const grupos = agruparParaGerir(potes, categorias);

  return (
    <>
      {/*
        ⚠ **A volta explícita (spec 07).**

        Esta rota fica fora da barra de navegação, e no navegador quem trazia
        de volta era o botão do próprio navegador. Instalado, esse botão não
        existe: sobra o gesto de borda, que funciona e **não aparece**. Quem
        entra aqui pelo rodapé do painel precisa de um caminho visível de
        volta, e não de saber que existe um gesto.
      */}
      <Link
        href="/dashboard"
        className="inline-flex min-h-11 items-center font-mono text-[10px] font-bold tracking-wider text-dim uppercase transition-colors hover:text-text"
      >
        ← Painel
      </Link>

      <SectionTitle className="mt-2">Categorias</SectionTitle>

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
              style={estiloDoPote(pote.cor)}
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
              potes={potes}
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

/**
 * Criar no fim do pote, já com o pote preenchido.
 *
 * O seletor de pote continua aparecendo mesmo assim: quem tocou no botão errado
 * conserta sem fechar e reabrir, e o formulário é o mesmo componente das duas
 * telas.
 */
function NovaCategoria({
  pote,
  potes,
}: {
  pote: PoteNaGestao;
  potes: PoteNaGestao[];
}) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [criando, comecar] = useTransition();

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
        aoSalvar={(v) =>
          comecar(async () => {
            const r = await criar(v);
            if (r.ok) {
              setErro(null);
              setAberto(false);
            } else {
              setErro(r.erro);
            }
          })
        }
        aoCancelar={() => {
          setErro(null);
          setAberto(false);
        }}
        salvando={criando}
        erro={erro}
        rotuloDoBotao="Criar"
      />
    </Card>
  );
}
