/**
 * Ler o que o Postgres disse quando recusou uma escrita.
 *
 * ## Por que num arquivo só
 *
 * A regra que já valeu quatro vezes nesta base: escrita duas vezes, vira
 * arquivo. `ehChaveDuplicada` nasceu dentro de `mexerNaRegra.service.ts` (D9) e
 * a B1 da spec 05 precisa da mesma leitura — com uma diferença que obriga a
 * generalizar, ver `restricaoViolada`.
 *
 * ⚠ **O driver do Neon embrulha o erro**, então o código pode estar no erro ou
 * na causa dele. Conferir os dois é mais barato do que descobrir na produção
 * que a tradução não pegou e alguém levou um 500 ao renomear.
 */

/** `23505` — violação de unicidade. */
export const UNICIDADE = "23505";

function campo(e: unknown, nome: string): string | null {
  return typeof e === "object" && e !== null && nome in e
    ? String((e as Record<string, unknown>)[nome])
    : null;
}

function doErroOuDaCausa(erro: unknown, nome: string): string | null {
  const direto = campo(erro, nome);
  if (direto !== null) return direto;

  return erro instanceof Error ? campo(erro.cause, nome) : null;
}

export function codigoDoErro(erro: unknown): string | null {
  return doErroOuDaCausa(erro, "code");
}

export function ehUnicidadeViolada(erro: unknown): boolean {
  return codigoDoErro(erro) === UNICIDADE;
}

/**
 * **Qual** restrição estourou — e não só que alguma estourou.
 *
 * `classification_rules` tem um único, então o código já diz qual. `categories`
 * tem **dois** — `(bucket_id, nome)` e `(bucket_id, slug)` — e eles falham por
 * motivos que exigem frases diferentes:
 *
 * - nome repetido é a pessoa digitando um nome que já existe;
 * - slug repetido acontece ao **mover** de pote, quando os nomes podem ser
 *   visivelmente diferentes.
 *
 * Traduzir os dois como "já existe uma com esse nome" faria o Davi ler isso
 * olhando para dois nomes que não são iguais.
 *
 * Cai para o texto do erro quando o driver não expõe o campo: nem toda camada
 * preserva `constraint`, e um `includes` é melhor do que uma tradução que não
 * pega.
 */
export function restricaoViolada(erro: unknown, nome: string): boolean {
  const declarada = doErroOuDaCausa(erro, "constraint");
  if (declarada !== null) return declarada === nome;

  return String(erro).includes(nome);
}
