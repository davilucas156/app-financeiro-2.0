import type { CategoriaEscolhivel } from "./categorias";

/**
 * "A regra que já pega este lançamento manda para outro lugar" — a pergunta
 * que faz a `PerguntaDeRegra` oferecer a regra por valor.
 *
 * ⚠ **Só dá para responder na tela.** O servidor sabe qual regra pega
 * (`jaPega`), mas o "outro lugar" é a categoria que você acabou de tocar, e ela
 * não existia quando a fila foi montada.
 *
 * `null` também quando a categoria da regra sumiu do catálogo — ela foi apagada
 * e o lançamento ficou apontando para o nada. Anunciar um conflito com uma
 * categoria sem nome seria pedir uma decisão sobre algo que não dá para ler; sem
 * ela, a pergunta volta às duas opções de sempre.
 *
 * Num `.ts` e não dentro do `.tsx` porque tem ramos de decisão, e o Vitest só
 * olha `.ts`.
 */
export function acharConflito(
  jaPega: { texto: string; categoriaId: string } | null,
  escolhidaId: string,
  catalogo: Map<string, CategoriaEscolhivel>,
): { texto: string; categoria: string } | null {
  if (!jaPega || jaPega.categoriaId === escolhidaId) return null;

  const destino = catalogo.get(jaPega.categoriaId);
  if (!destino) return null;

  return {
    texto: jaPega.texto,
    categoria: `${destino.emoji} ${destino.nome}`,
  };
}
