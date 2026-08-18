import { POTES_PADRAO } from "@/features/onboarding/potes-padrao";
import type { NovoPote, NovaCategoria } from "@/db/schema";

/**
 * Traduz `POTES_PADRAO` para linhas do banco (tarefa D7).
 *
 * Separado da server action porque a action precisa de sessão e transação
 * para rodar, e esta parte não precisa de nenhuma das duas — é só formato.
 *
 * Os nomes dos campos mudam na fronteira (`percentual` → `percentualMeta`,
 * `metaReferenciaCentavos` → `valorMetaCentavos`) porque o módulo dos potes
 * fala a língua da tela e o schema fala a do banco. A conversão mora aqui,
 * num lugar só.
 */

export function linhasDePotes(userId: string): NovoPote[] {
  return POTES_PADRAO.map((pote) => ({
    userId,
    slug: pote.slug,
    nome: pote.nome,
    emoji: pote.emoji,
    cor: pote.hex,
    percentualMeta: pote.percentual,
    valorMetaCentavos: pote.metaReferenciaCentavos,
    observacao: pote.observacao ?? null,
    ordem: pote.ordem,
  }));
}

/**
 * As categorias só podem ser montadas depois que os potes existem, porque
 * cada uma precisa do `bucket_id`. O mapa vem do banco, não do `returning`
 * do insert — ver o comentário na action.
 *
 * `userId` é gravado também na categoria, mesmo sendo derivável do pote: é a
 * decisão da C3 que permite toda consulta filtrar por `user_id` sem `join`.
 */
export function linhasDeCategorias(
  userId: string,
  idPorSlugDePote: Map<string, string>,
): NovaCategoria[] {
  const linhas: NovaCategoria[] = [];

  for (const pote of POTES_PADRAO) {
    const bucketId = idPorSlugDePote.get(pote.slug);

    // Um pote sem id significa que o insert não aconteceu **e** ele não
    // estava lá. Seguir em frente gravaria categorias órfãs.
    if (!bucketId) {
      throw new Error(`Pote "${pote.slug}" nao encontrado apos a insercao`);
    }

    for (const categoria of pote.categorias) {
      linhas.push({
        bucketId,
        userId,
        slug: categoria.slug,
        nome: categoria.nome,
        emoji: categoria.emoji,
        tagVisual: categoria.tagVisual,
        ordem: categoria.ordem,
      });
    }
  }

  return linhas;
}
