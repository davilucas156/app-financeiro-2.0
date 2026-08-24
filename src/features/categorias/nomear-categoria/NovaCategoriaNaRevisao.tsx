"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { PoteNaGestao } from "@/features/categorias/gerir-categorias/categoriasNaTela";
import { FormularioDeCategoria } from "./FormularioDeCategoria";

/**
 * "+ Nova categoria" no fim da lista da revisão (tarefa C2).
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
 * ⛔ **O "Criar" nasce apagado.** Mesma decisão do "Voltar" na D4 da spec 03 e
 * do "Trocar categoria" na B3 da spec 04: o formulário mostra a forma inteira e
 * o botão que gravaria fica apagado com uma linha dizendo quem o liga. Fingir
 * que funciona seria pior do que estar apagado.
 */
export function NovaCategoriaNaRevisao({ potes }: { potes: PoteNaGestao[] }) {
  const [aberto, setAberto] = useState(false);

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
        pote que você escolher e já pode receber este lançamento.
      </p>

      <FormularioDeCategoria
        potes={potes}
        aoSalvar={() => setAberto(false)}
        aoCancelar={() => setAberto(false)}
        rotuloDoBotao="Criar e usar aqui"
        aindaNaoLigado="A D2 liga isto: criar a categoria e classificar este lançamento com ela, numa transação só."
      />
    </Card>
  );
}
