import type { EstadoDoCampo } from "@/features/upload/enviar-extrato/CampoDeArquivo";

/**
 * O estado visual de um campo de arquivo, a partir do que o formulário sabe.
 *
 * A ordem é a prioridade: erro > enviando > escolhido > vazio. Um campo com
 * erro continua mostrando o erro mesmo durante o envio, e "enviando" vence
 * "escolhido" porque é ele que trava o campo.
 */
export function estadoDoCampo({
  erro,
  enviando,
  escolhido,
}: {
  /** A mensagem de recusa do campo, ou `null`/vazio se não há. */
  erro: string | null | undefined;
  enviando: boolean;
  /** Há um arquivo aceito neste campo. */
  escolhido: unknown;
}): EstadoDoCampo {
  if (erro) return "erro";
  if (enviando) return "enviando";
  if (escolhido) return "escolhido";
  return "vazio";
}
