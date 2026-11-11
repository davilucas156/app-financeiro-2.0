const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Um id fora desse formato nunca existiria — e o Postgres daria erro de tipo, não "não encontrado". */
export function ehUuid(valor: string): boolean {
  return UUID.test(valor);
}
