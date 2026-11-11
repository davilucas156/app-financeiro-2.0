/** A frase de erro de um `useActionState` que devolve `{ ok, erro }`, ou `null`. */
export function erroDoActionState(
  resultado: { ok: boolean; erro?: string } | null,
): string | null {
  return resultado && !resultado.ok ? (resultado.erro ?? null) : null;
}
