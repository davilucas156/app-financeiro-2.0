import "server-only";

import { cookies } from "next/headers";
import { COOKIE_DO_TEMA, temaEscolhido, type Tema } from "./tema";

/**
 * O tema deste aparelho, lido do cookie (tarefa C1 da spec 08).
 *
 * Dois lugares perguntam: a moldura da raiz, que carimba o `data-tema` no
 * `<html>` antes da primeira pintura, e a `/configuracoes`, que marca a opção
 * escolhida. Escrito duas vezes, um dia um deles esqueceria o `temaEscolhido` e
 * passaria o texto cru do cookie direto para um atributo do HTML.
 *
 * ⚠ **Ler cookie torna a rota dinâmica.** Aqui isso não custa nada: a moldura
 * de `(app)` já é `force-dynamic` desde a spec 01 por causa do mês no
 * cabeçalho, e todas as telas do app dependem de sessão. É a descoberta 5 da
 * spec 08 sendo barata justamente por causa de uma decisão antiga.
 */
export async function temaAtual(): Promise<Tema> {
  const cookieStore = await cookies();

  return temaEscolhido(cookieStore.get(COOKIE_DO_TEMA)?.value);
}
