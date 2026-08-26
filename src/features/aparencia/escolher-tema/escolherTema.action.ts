"use server";

import { gravarPreferencia } from "@/features/aparencia/preferencia/gravarPreferencia";
import {
  COOKIE_DO_TEMA,
  temaEscolhido,
  type Tema,
} from "@/features/aparencia/tema/tema";

/**
 * Gravar a preferência de tema (tarefa C1 da spec 08).
 *
 * ## Por que não passa por `garantirUsuario()`
 *
 * É a única action do projeto que não olha para o usuário, e é de propósito: a
 * preferência é **do aparelho**, não da conta (pendência 1). Ela precisa
 * funcionar em `/entrar`, onde ainda não existe sessão — e é justamente lá que
 * a primeira pessoa a abrir o app vai estar.
 *
 * Não há `user_id` para vazar aqui porque não há nada de usuário envolvido: o
 * efeito inteiro é um cookie de aparência no navegador de quem pediu.
 *
 * ## Por que não devolve `{ ok, erro }` como as outras
 *
 * Porque não há erro possível que valha uma frase na tela. Valor estranho vira
 * o padrão (A2), e a tela **já trocou de cor antes desta chamada**: o cliente
 * aplica o tema na hora e usa a action só para lembrar. Uma mensagem de falha
 * apareceria embaixo de uma tela que visivelmente funcionou.
 */
export async function escolherTema(tema: Tema): Promise<void> {
  /*
   * ⚠ **Passa por `temaEscolhido` mesmo o argumento sendo tipado.** O tipo é
   * garantia de compilação; uma action é um endpoint HTTP e recebe o que
   * mandarem. Sem isto, `escolherTema("<script>")` gravaria a string no cookie
   * — e ela voltaria carimbada no atributo `data-tema` do `<html>`.
   */
  const seguro = temaEscolhido(tema);

  /*
   * As opções do cookie — e o porquê de cada uma — moram em
   * `preferencia/gravarPreferencia.ts` desde a spec 10. Elas valiam palavra por
   * palavra para o tamanho da letra, e decisão repetida em duas actions é
   * decisão que um dia diverge numa delas.
   */
  await gravarPreferencia(COOKIE_DO_TEMA, seguro);
}
