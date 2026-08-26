"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";
import { ListaDeCategorias } from "@/features/classificacao/revisar-lancamento/ListaDeCategorias";
import { decidir } from "@/features/classificacao/revisar-lancamento/decidirLancamento.action";
import type { LancamentoNoPainel } from "@/features/painel/painel-do-mes/poteNoPainel";
import { avisoDaTroca, ehTrocaDeVerdade } from "./troca";

/**
 * Corrigir a categoria de um lançamento já classificado (tarefa D4).
 *
 * **É o buraco que a D9 da spec 03 expôs.** `/revisao` só mostra a fila: assim
 * que um lançamento é classificado ele some dali, e a decisão vira permanente.
 * Corrigir a regra sem poder corrigir o que ela já pegou é meia correção.
 *
 * ## Nada de novo do lado do servidor
 *
 * `decidirLancamento` já faz exatamente isto desde a D4 da spec 03: confere a
 * categoria contra o `user_id`, lê o estado anterior com `for update`, grava, e
 * deixa a sombra do desfazer. A action já revalida `/dashboard`.
 *
 * ## "Sempre classificar assim" não aparece aqui, e não é economia
 *
 * A pergunta existe na revisão e **mentiria** neste lugar:
 * `aplicarAosIrmaos` procura irmãos com `categoria_id IS NULL`, e quem está no
 * painel já está classificado — os parecidos dele também. A regra nasceria, não
 * pegaria ninguém, e a tela diria "pronto" sobre um mês que continuaria errado
 * em cinco linhas.
 *
 * Para "todos os Uber estão no pote errado" o caminho é a `/regras` da D9.
 *
 * ## O "Voltar" não é duplicado aqui
 *
 * A sombra é **uma por conta** — a chave primária de `decision_undo` é o
 * `user_id`, e isso é a promessa do botão: "reabre o anterior", singular. Um
 * segundo botão lendo a mesma linha mostraria, no painel, um "Voltar" para uma
 * decisão tomada na revisão sobre um lançamento que não está nesta tela.
 */
export function TrocarCategoria({
  lancamento,
  categorias,
}: {
  lancamento: LancamentoNoPainel;
  categorias: CategoriaEscolhivel[];
}) {
  const [aberto, setAberto] = useState(false);
  const [trocado, setTrocado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [gravando, iniciar] = useTransition();

  const escolher = (categoria: CategoriaEscolhivel) => {
    // A lista já marca a atual como não tocável. Aqui é a mesma decisão do
    // outro lado: gravar "trocou para o que já era" apagaria a procedência da
    // C3 e sobrescreveria a sombra do desfazer, sem nada mudar na tela.
    if (!ehTrocaDeVerdade(lancamento.categoriaId, categoria.id)) {
      setAberto(false);
      return;
    }

    iniciar(async () => {
      setErro(null);

      const r = await decidir({
        tipo: "categoria",
        lancamentoId: lancamento.id,
        categoriaId: categoria.id,
      });

      if (!r.ok) {
        setErro(r.erro);
        return;
      }

      setAberto(false);
      setTrocado(true);
    });
  };

  if (!aberto) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => {
            setTrocado(false);
            setAberto(true);
          }}
          className="inline-flex min-h-11 items-center rounded-card border border-border2 px-3 text-3xs font-bold text-text transition-colors hover:bg-card2"
        >
          Trocar categoria
        </button>

        {/*
          O lançamento que muda de pote some daqui e aparece no outro — essa
          mudança de lugar **é** o aviso. Este texto é para o outro caso: trocar
          para uma categoria do mesmo pote, onde nada se move.
        */}
        {trocado && (
          <p className="mt-1.5 text-3xs leading-relaxed text-dim">
            Trocado. Se errou,{" "}
            <Link href="/revisao" className="text-primary underline">
              dá para desfazer na revisão
            </Link>
            .
          </p>
        )}
      </div>
    );
  }

  const aviso = avisoDaTroca(lancamento.veioDeRegra);

  return (
    <div
      className="w-full rounded-pote border border-primary/30 bg-bg/60 p-3"
      aria-busy={gravando || undefined}
    >
      {aviso && (
        <p className="text-2xs leading-relaxed text-gold">
          ⚠ {aviso}{" "}
          <Link href="/regras" className="underline">
            Ver regras
          </Link>
          .
        </p>
      )}

      <div className={aviso ? "mt-3" : undefined}>
        <ListaDeCategorias
          categorias={categorias}
          direcao={lancamento.direcao}
          atualId={lancamento.categoriaId}
          aoEscolher={escolher}
          titulo="Trocar para"
        />
      </div>

      <button
        type="button"
        onClick={() => setAberto(false)}
        disabled={gravando}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-card border border-border2 bg-card px-4 text-xs font-bold text-text transition-colors hover:bg-card2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {gravando ? "Gravando…" : "Cancelar"}
      </button>

      {erro && (
        <p role="alert" className="mt-2 text-2xs leading-relaxed text-red">
          {erro}
        </p>
      )}
    </div>
  );
}
