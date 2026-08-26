"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ROTULOS_DO_TAMANHO,
  TAMANHOS,
  type Tamanho,
} from "@/features/aparencia/letra/letra";
import { escolherLetra } from "./escolherLetra.action";

/**
 * Os três tamanhos de letra (spec 10, tarefas D1 e D2).
 *
 * ## A troca acontece antes da action, não depois
 *
 * O tamanho é aplicado **no ato**, escrevendo o atributo no `<html>` — o mesmo
 * atributo que o servidor carimba. Só depois a action grava o cookie, em
 * segundo plano.
 *
 * A ordem importa, e aqui até mais do que no tema: esperar a ida ao servidor
 * faria a tela demorar meio segundo para responder a um toque cujo efeito é **a
 * tela inteira**. É o tipo de atraso que faz a pessoa tocar de novo.
 *
 * ## O que este seletor **não** tem, e o `SeletorDeTema` tem
 *
 * A nota de "agora o sistema pede claro". Não existe "seguir o sistema" aqui: o
 * navegador não expõe preferência de tamanho de fonte por `prefers-*`, então os
 * três degraus são escolhas, não adiamentos.
 *
 * ## Por que não há amostra de texto
 *
 * Porque a amostra é a tela. O rótulo, a nota e o resto do app trocam de tamanho
 * no mesmo toque — um "Aa" de exemplo seria um segundo lugar para a verdade
 * morar, e um lugar a mais para ela ficar desatualizada.
 */
export function SeletorDeLetra({ escolhido }: { escolhido: Tamanho }) {
  const [tamanho, setTamanho] = useState(escolhido);
  const [, transicao] = useTransition();

  /*
   * ⚠ **Num efeito, e não dentro do `onClick`.** Escrever no `document` durante
   * o tratamento do evento é mutação de coisa que o React não controla, e o
   * lint do React 19 recusa — com razão: no toque seguinte o estado e o DOM
   * poderiam discordar. Preso ao estado, o atributo é sempre o que a tela
   * mostra. Foi assim que o `SeletorDeTema` acabou.
   */
  useEffect(() => {
    document.documentElement.dataset.letra = tamanho;
  }, [tamanho]);

  function escolher(novo: Tamanho) {
    setTamanho(novo);

    transicao(() => {
      void escolherLetra(novo);
    });
  }

  return (
    <div role="radiogroup" aria-label="Tamanho da letra" className="space-y-2">
      {TAMANHOS.map((opcao) => {
        const marcado = opcao === tamanho;
        const { titulo, nota } = ROTULOS_DO_TAMANHO[opcao];

        return (
          <button
            key={opcao}
            type="button"
            role="radio"
            aria-checked={marcado}
            onClick={() => escolher(opcao)}
            className={`flex min-h-11 w-full items-center gap-3 rounded-pote border px-4 py-3 text-left transition-colors ${
              marcado
                ? "border-primary/50 bg-card2"
                : "border-border bg-card hover:bg-card2"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                marcado ? "border-primary" : "border-border2"
              }`}
            >
              {marcado && <span className="size-2 rounded-full bg-primary" />}
            </span>

            <span className="min-w-0">
              <span className="block text-sm font-bold text-text">
                {titulo}
              </span>
              <span className="block text-xs text-dim">{nota}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
