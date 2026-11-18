import "server-only";

import { cookies } from "next/headers";
import { COOKIE_DO_TEMA, temaEscolhido, type Tema } from "./tema";

/**
 * O tema deste aparelho, lido do cookie (tarefa C1 da spec 08).
 *
 * Cinco lugares perguntam: a raiz (três chamadas em `src/app/layout.tsx`), que
 * carimba o `data-tema` no `<html>` antes da primeira pintura; a moldura de
 * `(app)`; a `/configuracoes`, que marca a opção escolhida; e `entrar` e
 * `cadastrar`, que escolhem a aparência do Clerk. Escrito cinco vezes, um dia
 * um deles esqueceria o `temaEscolhido` e passaria o texto cru do cookie direto
 * para um atributo do HTML.
 *
 * ⚠ **Ler cookie torna a rota dinâmica.** O custo já existe na raiz, que lê o
 * tema em toda requisição: esta função não acrescenta nenhum.
 */
export async function temaAtual(): Promise<Tema> {
  const cookieStore = await cookies();

  return temaEscolhido(cookieStore.get(COOKIE_DO_TEMA)?.value);
}
