"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ROTULOS_DO_TEMA,
  TEMAS,
  type Tema,
} from "@/features/aparencia/tema/tema";
import { useSistemaClaro } from "@/features/aparencia/tema/useTemaEfetivo";
import { escolherTema } from "./escolherTema.action";

/**
 * As três opções de aparência (tarefas B2 e C1 da spec 08).
 *
 * ## A troca acontece antes da action, não depois
 *
 * O tema é aplicado **no ato**, escrevendo o atributo no `<html>` — o mesmo
 * atributo que o servidor carimba. Só depois a action grava o cookie, em
 * segundo plano.
 *
 * A ordem importa: esperar a ida ao servidor para trocar de cor faria a tela
 * demorar meio segundo para responder a um toque cujo efeito é **a tela
 * inteira**. É o tipo de atraso que faz a pessoa tocar de novo.
 *
 * ## Por que não há mensagem de erro
 *
 * Porque a troca já se vê. Se a gravação falhar, o tema volta ao anterior na
 * próxima abertura — e um aviso vermelho embaixo de uma tela que visivelmente
 * mudou de cor confundiria mais do que informaria.
 */
export function SeletorDeTema({ escolhido }: { escolhido: Tema }) {
  const [tema, setTema] = useState(escolhido);
  const [, transicao] = useTransition();

  const sistemaEstaClaro = useSistemaClaro();

  /*
   * O `<html>` é o mesmo elemento que o servidor carimba na raiz, e escrever
   * nele aqui é o que faz a tela trocar de cor **no toque**.
   *
   * ⚠ **Num efeito, e não dentro do `onClick`.** Escrever no `document` durante
   * o tratamento do evento é mutação de coisa que o React não controla, e o
   * lint do React 19 recusa — com razão: no toque seguinte o estado e o DOM
   * poderiam discordar. Preso ao estado, o atributo é sempre o que a tela
   * mostra.
   *
   * ⚠ **A action não revalida nada**, então este efeito é o único jeito de a
   * cor mudar sem recarregar. É de propósito: revalidar a raiz para trocar uma
   * variável de CSS custaria uma ida ao servidor e um render da árvore inteira.
   */
  useEffect(() => {
    document.documentElement.dataset.tema = tema;
  }, [tema]);

  function escolher(novo: Tema) {
    setTema(novo);

    transicao(() => {
      void escolherTema(novo);
    });
  }

  return (
    <div role="radiogroup" aria-label="Aparência" className="space-y-2">
      {TEMAS.map((opcao) => {
        const marcado = opcao === tema;
        const { titulo, nota } = ROTULOS_DO_TEMA[opcao];

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
              <span className="block text-xs text-dim">
                {nota}
                {/*
                  ⚠ **"Seguir o sistema" precisa dizer o que o sistema está
                  pedindo agora.** Sem isto, quem já está num aparelho escuro
                  toca nesta opção e não vê nada acontecer — e não tem como
                  saber se funcionou ou se o botão está quebrado.
                */}
                {opcao === "sistema" && sistemaEstaClaro !== null && (
                  <span className="text-dim">
                    {" "}
                    Agora ele pede {sistemaEstaClaro ? "claro" : "escuro"}.
                  </span>
                )}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
