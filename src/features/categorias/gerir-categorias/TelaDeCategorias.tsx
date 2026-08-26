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
        className="inline-flex min-h-11 items-center font-mono text-3xs font-bold tracking-wider text-dim uppercase transition-colors hover:text-text"
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
        <PoteRecolhivel
          key={pote.id}
          pote={pote}
          categorias={doPote}
          potes={potes}
        />
      ))}

      <p className="mt-8 text-2xs leading-relaxed text-dim">
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

/**
 * Um pote e o que há dentro dele, recolhível (spec 09, tarefa B1).
 *
 * ## Por que recolhido é o padrão
 *
 * O seed cria **26 categorias em 9 potes**. Com os cabeçalhos e os "+ Nova
 * categoria", são ~44 blocos empilhados numa tela de 360px — antes de o usuário
 * criar a primeira categoria dele. A tela existe para achar uma categoria, e
 * era isso que ela fazia pior: o único jeito de achar era rolar.
 *
 * Recolhida, ela é uma lista de nove linhas que cabe na tela inteira.
 *
 * ## Recolher não é esconder
 *
 * ⚠ **Os nove potes continuam listados, inclusive os vazios.** É a B5 da spec
 * 05, e ela não expira: se a tela derivasse os potes das categorias, o pote sem
 * categoria nenhuma sumiria justamente da única tela onde daria para criar uma
 * dentro dele — e ficaria inalcançável para sempre.
 *
 * Recolhido, o pote vazio fica **mais** visível: "sem categoria" é a única coisa
 * escrita na linha dele, no meio de outras oito que trazem número.
 *
 * ⚠ **A contagem fica no cabeçalho porque é o que sobra.** Fechado, ela é a
 * única informação disponível — e "4 categorias" é exatamente o que decide se
 * vale abrir.
 *
 * ## O estado não é lembrado entre visitas
 *
 * Guardar exigiria cookie ou `localStorage` para uma tela que se visita
 * raramente, e o preço de errar é abrir com um pote aberto que não é o que a
 * pessoa veio ver. Criar uma categoria **não** fecha o pote: o `useState` mora
 * aqui e a chave é o id do pote, então a revalidação do servidor não o remonta.
 */
function PoteRecolhivel({
  pote,
  categorias,
  potes,
}: {
  pote: PoteNaGestao;
  categorias: CategoriaNaGestao[];
  potes: PoteNaGestao[];
}) {
  const [aberto, setAberto] = useState(false);

  const contagem =
    categorias.length === 0
      ? "sem categoria"
      : categorias.length === 1
        ? "1 categoria"
        : `${categorias.length} categorias`;

  return (
    <section className="mt-2">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="flex min-h-11 w-full items-center gap-2 rounded-card border border-border bg-card px-4 py-2.5 text-left transition-colors hover:bg-card2"
      >
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={estiloDoPote(pote.cor)}
        />
        <h2 className="min-w-0 flex-1 font-mono text-3xs font-bold tracking-[1.5px] text-dim uppercase">
          {pote.emoji} {pote.nome}
        </h2>
        <span className="shrink-0 font-mono text-3xs text-dim2">
          {contagem}
        </span>
        {/*
          A seta gira em vez de trocar de desenho: quem já viu a de cima
          reconhece a de baixo como a mesma coisa virada, e não como outro
          botão.
        */}
        <span
          aria-hidden="true"
          className={`shrink-0 text-3xs text-dim transition-transform ${aberto ? "rotate-90" : ""}`}
        >
          ▶
        </span>
      </button>

      {aberto && (
        <div className="mt-2">
          {categorias.map((categoria) => (
            <CartaoDaCategoria
              key={categoria.id}
              categoria={categoria}
              pote={pote}
              potes={potes}
            />
          ))}

          <NovaCategoria pote={pote} potes={potes} />
        </div>
      )}
    </section>
  );
}
