import { normalizarDescricao } from "@/features/upload/ler-arquivo/preparar";

/**
 * O outro lado de uma transferência (tarefa A3).
 *
 * Existe porque o extrato tem uma classe de lançamento que nenhum LLM
 * resolve: um Pix não diz o que você comprou, diz **para quem** o dinheiro
 * foi. Saber que uma dessas pessoas é sua mãe e outra é o mecânico é
 * conhecimento seu, não do modelo. Então o motor pergunta uma vez e nunca mais.
 *
 * "Pessoa" aqui quer dizer **contraparte**, não ser humano: empresas que você
 * paga por Pix caem no mesmo tipo de regra, e é o comportamento certo — o que
 * identifica o lançamento é quem está do outro lado.
 *
 * ## Por que o nome, e não o número da conta
 *
 * Medido: a **mesma** contraparte apareceu no mesmo mês com dois números de
 * conta diferentes, e escrita de duas maneiras (uma toda em maiúsculas, outra
 * não). Uma regra amarrada ao número teria falhado na segunda vez.
 *
 * O nome sai daqui **como está escrito**, só com o espaço arrumado. Quem
 * normaliza para comparar é a A1 — assim a tela mostra "Fulana de Tal" em vez
 * de "FULANA DE TAL" na hora de perguntar se vira regra.
 */

/** `Pix enviado: "…"` — o tipo do evento e o conteúdo entre aspas. */
const EVENTO_DA_CONTA = /^([^:]+):\s*"(.*)"\s*$/;

/** `Cp :00000000-Fulana de Tal` */
const COM_CHAVE = /^Cp\s*:?\s*\d+\s*-\s*(.+)$/i;

/**
 * `00000 11112222 FULANO SOUZA` e `999 0000 1234567 Fulano de Tal` — banco,
 * agência e conta antes do nome.
 *
 * **Dois grupos de dígitos, no mínimo.** Com um só, qualquer descrição que
 * comece com número viraria uma contraparte inventada.
 */
const COM_BANCO_E_AGENCIA = /^(?:\d+\s+){2,}(.+)$/;

/**
 * O banco escreve literalmente `null` quando não sabe o nome da contraparte.
 * Medido num Pix devolvido.
 */
const SEM_NOME = "NULL";

/** Menos que isso não identifica ninguém. */
const MINIMO = 3;

export function pessoaDe(descricao: string): string | null {
  const texto = descricao.trim();

  const evento = EVENTO_DA_CONTA.exec(texto);
  const conteudo = (evento ? evento[2] : texto).trim();

  const achado =
    COM_CHAVE.exec(conteudo)?.[1] ?? COM_BANCO_E_AGENCIA.exec(conteudo)?.[1];

  if (!achado) return null;

  const nome = achado.replace(/\s+/g, " ").trim();
  const comparavel = normalizarDescricao(nome);

  if (comparavel.length < MINIMO) return null;
  if (comparavel === SEM_NOME) return null;
  // Só dígitos e pontuação é número de documento, não contraparte.
  if (!/[A-Z]/.test(comparavel)) return null;

  return nome;
}
