"use server";

import { gravarPreferencia } from "@/features/aparencia/preferencia/gravarPreferencia";
import {
  COOKIE_DA_LETRA,
  letraEscolhida,
  type Tamanho,
} from "@/features/aparencia/letra/letra";

/**
 * Gravar a preferência de tamanho de letra (spec 10, tarefa D1).
 *
 * ## Por que não passa por `garantirUsuario()`
 *
 * É a segunda action do projeto que não olha para o usuário, e é de propósito: a
 * preferência é **do aparelho**, não da conta. Ela precisa funcionar em
 * `/entrar`, onde ainda não existe sessão.
 *
 * Não há `user_id` para vazar aqui porque não há nada de usuário envolvido: o
 * efeito inteiro é um cookie de aparência no navegador de quem pediu.
 *
 * ## Por que não devolve `{ ok, erro }` como as outras
 *
 * Porque não há erro possível que valha uma frase na tela. Valor estranho vira o
 * padrão, e a tela **já mudou de tamanho antes desta chamada**: o cliente aplica
 * no ato e usa a action só para lembrar. Uma mensagem de falha apareceria
 * embaixo de uma tela que visivelmente funcionou.
 */
export async function escolherLetra(tamanho: Tamanho): Promise<void> {
  /*
   * ⚠ **Passa por `letraEscolhida` mesmo o argumento sendo tipado.** O tipo é
   * garantia de compilação; uma action é um endpoint HTTP e recebe o que
   * mandarem. Sem isto, `escolherLetra("<script>")` gravaria a string no cookie
   * — e ela voltaria carimbada no atributo `data-letra` do `<html>`.
   */
  const seguro = letraEscolhida(tamanho);

  await gravarPreferencia(COOKIE_DA_LETRA, seguro);
}
