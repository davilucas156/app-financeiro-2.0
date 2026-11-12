const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Aceita `unknown` porque o valor vem do cliente: em runtime uma Server Action
 * pode receber `null` ou número mesmo com o tipo dizendo `string`. Um id fora
 * desse formato nunca existiria — e o Postgres daria erro de tipo, não "não
 * encontrado".
 */
export function ehUuid(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}
