"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import type { PoteNaGestao } from "@/features/categorias/gerir-categorias/categoriasNaTela";
import { criarEUsarAqui } from "./criarEClassificar.action";
import { FormularioDeCategoria } from "./FormularioDeCategoria";

/**
 * "+ Nova categoria" no fim da lista da revisão (tarefas C2 e D2).
 *
 * ## Está aqui porque é aqui que a falta aparece
 *
 * O lugar em que se descobre que falta uma categoria é a `/revisao`, olhando um
 * lançamento que não cabe em nada. Mandar a pessoa para outra tela, criar,
 * voltar e reencontrar o lançamento seria a tela punindo você por ter um gasto
 * novo.
 *
 * ## E no **fim** da lista, que é o controle de risco da spec
 *
 * Criar categoria é fácil e barato, e uma conta com 60 categorias tem um painel
 * que não diz nada — o método dos potes funciona porque a lista cabe na cabeça.
 * A tela não impede; ela faz você passar por todas as que já existem primeiro.
 *
 * ## A assimetria do "Voltar", dita antes e não depois
 *
 * O "Voltar" desfaz a classificação e **não** apaga a categoria criada — a
 * mesma régua da D6, em que desfazer uma classificação não desfaz o
 * aprendizado. Quem lê antes decide sabendo; quem lê depois só descobre.
 */
export function NovaCategoriaNaRevisao({
  potes,
  lancamentoId,
}: {
  potes: PoteNaGestao[];
  /** O lançamento que motivou a criação — ele é classificado no mesmo toque. */
  lancamentoId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [criando, comecar] = useTransition();

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-card border border-dashed border-border2 px-4 text-xs font-bold text-dim transition-colors hover:bg-card"
      >
        + Nova categoria
      </button>
    );
  }

  return (
    <Card>
      <p className="text-xs leading-relaxed text-dim">
        Para quando este lançamento não cabe em nenhuma das de cima. Ela nasce no
        pote que você escolher e já recebe este lançamento.
      </p>

      <p className="mt-2 text-[11px] leading-relaxed text-dim2">
        O &ldquo;Voltar&rdquo; depois desfaz a classificação, mas não apaga a
        categoria — ela fica, como ficam as regras.
      </p>

      <FormularioDeCategoria
        potes={potes}
        aoSalvar={(v) =>
          comecar(async () => {
            const r = await criarEUsarAqui({ ...v, lancamentoId });
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
        rotuloDoBotao="Criar e usar aqui"
      />
    </Card>
  );
}
