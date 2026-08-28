/**
 * O que a tela de arrumação sabe (tarefa C1).
 *
 * Puro, e num `.ts` de propósito: os componentes são `.tsx` e o Vitest só olha
 * `.ts`. A decisão que vale teste é `agruparParaGerir` — ver abaixo por quê.
 */

export type PoteNaGestao = {
  id: string;
  slug: string;
  nome: string;
  emoji: string;
  /** Hex, direto de `buckets.cor` — nunca token do Tailwind. */
  cor: string;
  tipo: "gasto" | "renda";
  ordem: number;
};

export type CategoriaNaGestao = {
  id: string;
  nome: string;
  emoji: string;
  ordem: number;
  poteId: string;
  /**
   * Todos os lançamentos com esta categoria, **inclusive os excluídos**.
   *
   * É o número que autoriza mover (B2) e o que faz esta tela valer a pena:
   * "nunca foi usada" transforma uma lista de nomes numa lista de
   * consequências, do mesmo jeito que "já classificou 8" fez na D9.
   */
  lancamentos: number;
  /** Quantos daqueles estão fora do cálculo — a ressalva da A3. */
  foraDoCalculo: number;
  regras: number;
};

export type GrupoDeGestao = {
  pote: PoteNaGestao;
  categorias: CategoriaNaGestao[];
};

/**
 * Os potes, com o que cada um tem dentro.
 *
 * ⚠ **Percorre os potes e distribui as categorias**, e não o contrário. É a B5
 * do outro lado, e a diferença entre as duas frases é o defeito inteiro:
 * agrupando pelas categorias, o pote sem nenhuma some — e some **exatamente da
 * única tela onde daria para criar uma categoria dentro dele**.
 *
 * Ficaria inalcançável para sempre, e ninguém entenderia por quê.
 */
export function agruparParaGerir(
  potes: PoteNaGestao[],
  categorias: CategoriaNaGestao[],
): GrupoDeGestao[] {
  const porPote = new Map<string, CategoriaNaGestao[]>();

  for (const c of categorias) {
    const lista = porPote.get(c.poteId) ?? [];
    lista.push(c);
    porPote.set(c.poteId, lista);
  }

  return [...potes]
    .sort((a, b) => a.ordem - b.ordem)
    .map((pote) => ({
      pote,
      categorias: (porPote.get(pote.id) ?? []).sort(
        (a, b) => a.ordem - b.ordem,
      ),
    }));
}

/**
 * Mover de pote só enquanto a categoria estiver vazia (B2, descoberta 4).
 *
 * A regra mora no servidor; a tela a repete para **não oferecer** um botão que
 * seria recusado. O que ela não faz é esconder o motivo: com lançamentos
 * dentro, o botão sai e uma linha explica por quê.
 */
export function podeMover(categoria: CategoriaNaGestao): boolean {
  return categoria.lancamentos === 0;
}

/** "12 lançamentos · 2 regras" — a linha de orientação do cartão. */
export function oQueDependeDela(categoria: CategoriaNaGestao): string {
  if (categoria.lancamentos === 0 && categoria.regras === 0) {
    return "nunca foi usada";
  }

  const partes: string[] = [];

  if (categoria.lancamentos > 0) {
    partes.push(
      `${categoria.lancamentos} ${categoria.lancamentos === 1 ? "lançamento" : "lançamentos"}`,
    );
  }

  if (categoria.regras > 0) {
    partes.push(
      `${categoria.regras} ${categoria.regras === 1 ? "regra" : "regras"}`,
    );
  }

  return partes.join(" · ");
}
