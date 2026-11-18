import { ehUuid } from "@/lib/uuid";

/**
 * O que `desfazerImportacao` responde — a parte que não precisa de banco.
 *
 * ## Por que isto saiu do serviço
 *
 * `desfazerEnvio.service.ts` é `server-only` e fala com o banco, e nenhum
 * serviço deste projeto tem teste. A frase que ele devolve, porém, é uma
 * decisão que vale travar: **envio inexistente, envio de outro dono e id
 * malformado dizem exatamente o mesmo**. Se a resposta os diferenciasse, ela
 * viraria um jeito de descobrir quais ids existem na conta de outra pessoa.
 *
 * ⚠ **O que este teste NÃO cobre:** que o `where` do serviço leva o `userId`.
 * Isso só um teste com banco pega; aqui fica garantido que, seja qual for o
 * motivo da recusa, a frase é uma só.
 */

export type ResultadoDesfazer =
  | { ok: true; lancamentosApagados: number; nomeArquivo: string }
  | { ok: false; erro: string };

export const NAO_ENCONTRADO =
  "Esse envio não está mais aqui. A lista foi atualizada.";

/** A recusa única: a mesma para "não existe", "não é seu" e "id malformado". */
export function envioNaoEncontrado(): ResultadoDesfazer {
  return { ok: false, erro: NAO_ENCONTRADO };
}

/**
 * Recusa antes de tocar no banco: um id fora do formato nunca existiria, e o
 * Postgres devolveria erro de tipo em vez de "não encontrado". `null` quando o
 * id pode seguir para a consulta.
 */
export function recusaDoImportId(importId: unknown): ResultadoDesfazer | null {
  return ehUuid(importId) ? null : envioNaoEncontrado();
}

/** O que sobra depois da consulta de dono e da deleção. */
export function resultadoDoDesfazer(
  envio: { nomeArquivo: string } | undefined,
  lancamentosApagados: number,
): ResultadoDesfazer {
  if (!envio) return envioNaoEncontrado();

  return { ok: true, lancamentosApagados, nomeArquivo: envio.nomeArquivo };
}
