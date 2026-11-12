import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";
import { semAcento } from "@/lib/semAcento";

/**
 * As categorias que a tela de revisão oferece (tarefas B2 e D3).
 *
 * ⚠ **Vêm do banco, não de `POTES_PADRAO`.** Até a D3 esta lista saía do
 * módulo do seed, o que servia para um protótipo mas guardaria o id errado: o
 * seed é o molde, e o que a D4 grava é o `uuid` da linha da conta do usuário.
 *
 * A cor também vem do banco (`buckets.cor`), e não do token do Tailwind, para
 * a fase 2 poder deixar o usuário mudá-la sem que a tela pare de refletir.
 */

export type PoteEscolhivel = {
  id: string;
  slug: string;
  nome: string;
  emoji: string;
  /** Hex, direto de `buckets.cor`. */
  cor: string;
  tipo: "gasto" | "renda";
  ordem: number;
};

export type CategoriaEscolhivel = {
  id: string;
  /** `conforto-lazer/alimentacao-fora` — a chave composta da A4. */
  chave: string;
  nome: string;
  emoji: string;
  ordem: number;
  pote: PoteEscolhivel;
};

/**
 * ⚠ **Aqui entram os nove potes, renda inclusive** — e essa é a decisão que
 * quase passou batido na C2.
 *
 * "As telas de pote filtram `tipo = 'gasto'`" vale para as telas **de pote**:
 * as de meta, de barra, de rateio. Esta não é uma delas.
 *
 * Um Pix recebido precisa de destino. Esconder renda daqui tornaria toda
 * entrada impossível de classificar à mão — e entrada é justamente o que forma
 * a base sobre a qual os outros oito potes são calculados.
 */
export function agruparPorPote(
  categorias: CategoriaEscolhivel[],
  direcao: Direcao,
): { pote: PoteEscolhivel; categorias: CategoriaEscolhivel[] }[] {
  const porPote = new Map<
    string,
    { pote: PoteEscolhivel; categorias: CategoriaEscolhivel[] }
  >();

  for (const c of categorias) {
    const grupo = porPote.get(c.pote.id) ?? { pote: c.pote, categorias: [] };
    grupo.categorias.push(c);
    porPote.set(c.pote.id, grupo);
  }

  for (const g of porPote.values()) {
    g.categorias.sort((a, b) => a.ordem - b.ordem);
  }

  /**
   * A ordem muda com a direção do lançamento.
   *
   * Numa lista de 9 potes e 25 categorias, quem acabou de receber um Pix não
   * devia rolar até o fim para achar "Renda extra". Entrada põe renda na
   * frente; saída a manda para o fim.
   *
   * Não é regra de negócio, é ordem de exibição.
   */
  const rendaPrimeiro = direcao === "entrada";

  return [...porPote.values()].sort((a, b) => {
    const rendaA = a.pote.tipo === "renda" ? 1 : 0;
    const rendaB = b.pote.tipo === "renda" ? 1 : 0;

    if (rendaA !== rendaB) {
      return rendaPrimeiro ? rendaB - rendaA : rendaA - rendaB;
    }

    return a.pote.ordem - b.pote.ordem;
  });
}

export function porId(
  categorias: CategoriaEscolhivel[],
): Map<string, CategoriaEscolhivel> {
  return new Map(categorias.map((c) => [c.id, c]));
}

/**
 * Texto pronto para comparar na busca: sem acento, minúsculo, sem espaço nas
 * pontas.
 *
 * ⚠ **Não é o `normalizarDescricao` do motor**, e não é descuido. Aquele mora em
 * `ler-arquivo/preparar.ts`, que importa `node:crypto` para a impressão digital
 * — puxá-lo para um componente de cliente quebraria o build.
 *
 * E os propósitos são diferentes: lá é comparação de regra, que precisa ser
 * idêntica à que gravou a regra; aqui é filtro de busca de tela, onde caixa
 * baixa basta.
 */
export function comparavel(texto: string): string {
  return semAcento(texto).toLowerCase().trim();
}

/**
 * As categorias que batem com a busca, por nome da categoria ou do pote.
 *
 * Busca vazia (ou só espaços) devolve `null`, e não a lista inteira: quem chama
 * usa esse `null` para saber que deve mostrar os potes agrupados, e não a lista
 * achatada da busca.
 */
export function filtrarCategorias(
  categorias: CategoriaEscolhivel[],
  busca: string,
): CategoriaEscolhivel[] | null {
  const alvo = comparavel(busca);
  if (!alvo) return null;

  return categorias.filter(
    (c) =>
      comparavel(c.nome).includes(alvo) ||
      comparavel(c.pote.nome).includes(alvo),
  );
}
