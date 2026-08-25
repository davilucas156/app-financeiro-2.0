"use client";

import { useSyncExternalStore } from "react";
import { TEMA_PADRAO, type Tema, type TemaEfetivo } from "./tema";

/**
 * Resolver "seguir o sistema" no cliente (tarefas C1 e D1 da spec 08).
 *
 * ## Por que isto existe, se o CSS já resolve sozinho
 *
 * O CSS resolve o **tema** sozinho, por `prefers-color-scheme`, e é o que faz a
 * troca não piscar. Mas há uma fronteira onde CSS não passa: o Clerk faz cálculo
 * de cor em cima dos valores que recebe, e `var(--color-card)` sai transparente
 * — está medido em `autenticacao/aparencia-clerk.ts` desde a spec 01.
 *
 * O widget do Clerk precisa de um **objeto**, escolhido em JavaScript. E como o
 * servidor não tem como saber a configuração do aparelho de quem pediu a
 * página, "sistema" só se resolve aqui.
 *
 * ⚠ **Não use este hook para pintar o que o CSS já pinta.** Ele responde
 * `TEMA_PADRAO` no servidor e no primeiro render, e só depois a verdade — quem
 * depender dele para o fundo da tela ganha de volta exatamente a piscada que a
 * descoberta 5 da spec 08 existe para evitar.
 */

const CONSULTA = "(prefers-color-scheme: light)";

function assinarOSistema(aoMudar: () => void) {
  const consulta = window.matchMedia(CONSULTA);

  consulta.addEventListener("change", aoMudar);
  return () => consulta.removeEventListener("change", aoMudar);
}

/**
 * O que o aparelho está pedindo — ou `null` enquanto não dá para saber.
 *
 * ⚠ **`null` no servidor, de propósito.** Afirmar qualquer coisa ali faria o
 * HTML do servidor discordar do primeiro render do cliente, que é o erro de
 * hidratação.
 *
 * ⚠ **`useSyncExternalStore` e não `useEffect` com `setState`.** É o hook feito
 * para ler coisa que vive fora do React, e `matchMedia` é isso. A versão com
 * efeito faz um render a mais e o React 19 recusa no lint, com razão: um estado
 * que só existe para copiar outro é um estado a mais para dessincronizar.
 */
export function useSistemaClaro(): boolean | null {
  return useSyncExternalStore(
    assinarOSistema,
    () => window.matchMedia(CONSULTA).matches,
    () => null,
  );
}

/** A escolha do usuário, já resolvida em algo que se pode pintar. */
export function useTemaEfetivo(escolhido: Tema): TemaEfetivo {
  const sistemaClaro = useSistemaClaro();

  if (escolhido !== "sistema") return escolhido;

  /*
   * Enquanto o sistema é desconhecido — servidor e primeiro render —, vale o
   * padrão. Ele é o mesmo que o CSS mostra nesse instante, então o widget não
   * aparece de uma cor e vira de outra: ele aparece já certo, ou aparece uma
   * fração de segundo depois, junto com a hidratação do próprio Clerk.
   */
  if (sistemaClaro === null) {
    return TEMA_PADRAO === "claro" ? "claro" : "escuro";
  }

  return sistemaClaro ? "claro" : "escuro";
}
