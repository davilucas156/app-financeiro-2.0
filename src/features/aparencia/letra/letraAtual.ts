import "server-only";

import { cookies } from "next/headers";
import { COOKIE_DA_LETRA, letraEscolhida, type Tamanho } from "./letra";

/**
 * O tamanho de letra deste aparelho, lido do cookie (spec 10, tarefa B2).
 *
 * Dois lugares perguntam: a moldura da raiz, que carimba o `data-letra` no
 * `<html>` antes da primeira pintura, e a `/configuracoes`, que marca a opção
 * escolhida. Escrito duas vezes, um dia um deles esqueceria o `letraEscolhida` e
 * passaria o texto cru do cookie direto para um atributo do HTML.
 *
 * ⚠ **Ler cookie torna a rota dinâmica.** O custo já existe na raiz, que lê o
 * tema e a letra em toda requisição: esta função não acrescenta nenhum.
 */
export async function letraAtual(): Promise<Tamanho> {
  const cookieStore = await cookies();

  return letraEscolhida(cookieStore.get(COOKIE_DA_LETRA)?.value);
}
