/**
 * A preferência de tema, como valor (tarefa A2 da spec 08).
 *
 * ## Por que é um arquivo, e um só
 *
 * Três lugares precisam da mesma resposta: a moldura da raiz, que carimba o
 * atributo no `<html>`; a tela de configurações, que marca a opção escolhida; e
 * a action, que grava. Escrita três vezes, ela diverge — é a mesma regra que
 * criou `chaveDaRegra.ts` na spec 03 e `lib/mes.ts` na 06.
 */

export const TEMAS = ["escuro", "claro", "sistema"] as const;

export type Tema = (typeof TEMAS)[number];

/**
 * O tema depois de resolvido: "sistema" não é um visual, é um adiamento.
 *
 * ⚠ **Quem resolve "sistema" é o CSS**, por `prefers-color-scheme`, e não o
 * servidor — que não tem como saber a configuração do aparelho de quem pediu a
 * página. O tipo existe para os poucos lugares onde a resposta precisa chegar
 * como valor, e não como cascata: a cor do pote (A3) e o objeto de aparência do
 * Clerk (descoberta 4).
 */
export type TemaEfetivo = "escuro" | "claro";

/**
 * ⚠ **O padrão é escuro, e isso é decisão** (pendência 3 da spec 08).
 *
 * "Seguir o sistema" pareceria o natural. Mas hoje **todo mundo está no
 * escuro**, e a maioria dos celulares está configurada em claro: subir com
 * `sistema` como padrão viraria o app do Davi para branco no primeiro deploy,
 * sem ele ter pedido nada. Mudança de aparência que ninguém pediu se lê como
 * defeito, não como funcionalidade.
 */
export const TEMA_PADRAO: Tema = "escuro";

export const COOKIE_DO_TEMA = "tema";

/**
 * Um ano.
 *
 * ⚠ **O cookie do tema não é sessão.** Sem `httpOnly` — não há nada secreto
 * nele — e com validade longa de propósito: um tema que expira junto com o
 * login é um tema que se perde toda vez que a pessoa volta.
 */
export const VALIDADE_DO_COOKIE_SEG = 60 * 60 * 24 * 365;

/**
 * O que veio no cookie → um dos três temas.
 *
 * ⚠ **Cookie é texto que o usuário controla, e valor desconhecido não é erro.**
 * `tema=roxo` cai no padrão sem exceção e sem log: quase sempre é um valor
 * gravado por uma versão anterior do app, não um ataque. Reclamar disso encheria
 * o log de produção com o histórico das nossas próprias mudanças.
 */
export function temaEscolhido(valor: string | undefined | null): Tema {
  if (valor === undefined || valor === null) return TEMA_PADRAO;

  const limpo = valor.trim().toLowerCase();

  return (TEMAS as readonly string[]).includes(limpo)
    ? (limpo as Tema)
    : TEMA_PADRAO;
}

export const ROTULOS_DO_TEMA: Record<Tema, { titulo: string; nota: string }> = {
  escuro: { titulo: "Escuro", nota: "O padrão do app." },
  claro: { titulo: "Claro", nota: "Para ler de dia, na rua." },
  sistema: {
    titulo: "Seguir o sistema",
    nota: "Acompanha o ajuste do aparelho.",
  },
};
