/**
 * A chave composta de uma categoria: `pote/categoria`.
 *
 * É o contrato textual entre quem monta o mapa `chave → id` (onboarding, revisão,
 * painel) e quem o consulta: a semente de regras (`semente.ts`, que escreve as
 * chaves como dado) e as sugestões (`sugestoes.ts`, que filtra por pote pelo
 * prefixo).
 *
 * ⚠ Composta de propósito: `assinaturas` existe em dois potes, e o slug sozinho
 * escolheria a errada metade das vezes. Se um lado mudasse o separador ou a
 * ordem, `idPorChave.get(...)` devolveria `undefined` e a regra deixaria de ser
 * semeada **sem erro nenhum** — por isso quem monta a chave chama esta função,
 * em vez de escrever o template à mão.
 */
export function chaveDaCategoria(
  poteSlug: string,
  categoriaSlug: string,
): string {
  return `${poteSlug}/${categoriaSlug}`;
}

/** O começo de toda chave de categoria daquele pote: `pote/`. */
export function prefixoDoPote(poteSlug: string): string {
  return `${poteSlug}/`;
}

/** O mapa `chave → id` que a semente e as sugestões consultam. */
export function mapaDeIdPorChave(
  categorias: { chave: string; id: string }[],
): Map<string, string> {
  return new Map(categorias.map((c) => [c.chave, c.id]));
}
