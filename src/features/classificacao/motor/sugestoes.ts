import type { Origem } from "@/features/upload/ler-arquivo/formatos";
import { normalizarDescricao } from "@/features/upload/ler-arquivo/preparar";
import { trechoEstavel } from "./trecho";

/**
 * As sugestões da tela de revisão (tarefa A4).
 *
 * Só entram em cena quando **nenhuma regra bateu** (A1). Sugestão não
 * classifica nada sozinha — encurta o caminho até o toque certo.
 *
 * ## Toda sugestão diz de onde veio
 *
 * Não é enfeite. Sugestão anônima é palpite que você aceita no escuro; com a
 * procedência, dá para saber se está confiando em você mesmo do mês passado ou
 * num palpite do banco que já se provou errado.
 *
 * É também o que deixa o LLM entrar depois como **mais uma fonte**, sem
 * reescrever nada.
 */

export type FonteDeSugestao =
  | "voce-ja-classificou"
  | "mesma-contraparte"
  | "categoria-do-banco"
  | "pote-do-banco";

export type Sugestao = {
  categoriaId: string;
  fonte: FonteDeSugestao;
  /** Frase curta, pronta para a tela. */
  porque: string;
};

/** O lançamento pendente que precisa de sugestão. */
export type AlvoDaSugestao = {
  descricao: string;
  origem: Origem;
  /** A contraparte, quando é transferência — ver A3. */
  pessoa?: string | null;
  /** O palpite do banco, como veio. **Nunca** verdade — ver A2. */
  categoriaDoBanco?: string | null;
};

/** Um lançamento que você já classificou antes. */
export type Classificado = {
  descricao: string;
  origem: Origem;
  pessoa?: string | null;
  categoriaId: string;
  /** `custos-fixos/telefonia` — composta, ver `CHAVE_COMPOSTA` abaixo. */
  chaveDaCategoria: string;
};

export type ContextoDeSugestao = {
  historico: Classificado[];
  /**
   * `pote/categoria` → id, para o usuário desta sessão.
   *
   * ⚠ **A chave é composta de propósito.** `assinaturas` existe duas vezes no
   * seed — uma em Custos Fixos, outra em Conforto & Lazer — e a unicidade no
   * banco é `(bucket_id, slug)`. Uma tradução que usasse só o slug escolheria
   * a errada metade das vezes.
   */
  idPorChave: Map<string, string>;
};

const MAXIMO = 3;

/**
 * Categorias do banco que apontam para **uma** categoria sua.
 *
 * As genéricas ficam de fora de propósito: `OUTROS`, `COMPRAS`, `SERVICOS` e
 * `PAGAMENTOS` somam 14 dos 32 rótulos medidos, e traduzir "outros" para
 * alguma coisa seria ruído vestido de sugestão. Ruído com etiqueta de
 * "sugerido" é pior que silêncio — convida ao toque distraído.
 */
const CATEGORIA_DO_BANCO: Record<string, string> = {
  RESTAURANTES: "conforto-lazer/alimentacao-fora",
  LIVRARIAS: "conhecimento/conteudo-ferramentas",
  ENTRETENIMENTO: "conforto-lazer/saidas-eventos",
};

/**
 * Categorias do banco que apontam para um **pote**, não para uma categoria.
 *
 * `TRANSPORTE` é o rótulo mais comum da fatura, mas o pote tem quatro
 * categorias — e a medição pegou o banco chamando de transporte uma compra em
 * loja online. Sugerir uma das quatro no chute seria inventar precisão.
 *
 * Então ele vira sugestão só quando o **seu histórico** desempata dentro do
 * pote.
 */
const POTE_DO_BANCO: Record<string, string> = {
  TRANSPORTE: "transporte",
};

export function sugerir(
  alvo: AlvoDaSugestao,
  contexto: ContextoDeSugestao,
): Sugestao[] {
  const encontradas: Sugestao[] = [];
  const jaTem = new Set<string>();

  const somar = (categoriaId: string | null | undefined, sugestao: Omit<Sugestao, "categoriaId">) => {
    if (!categoriaId || jaTem.has(categoriaId)) return;
    jaTem.add(categoriaId);
    encontradas.push({ categoriaId, ...sugestao });
  };

  // ── 1. Você já classificou esta mesma descrição ──────────────────────────
  //
  // O sinal mais forte que existe: é você concordando com você. Se já tinha
  // virado regra, a A1 teria resolvido antes de chegar aqui — então o que mora
  // no histórico é o que você decidiu respondendo "só desta vez".
  const chave = chaveDaDescricao(alvo.descricao, alvo.origem);

  const igual = contexto.historico.find(
    (h) => chaveDaDescricao(h.descricao, h.origem) === chave,
  );

  somar(igual?.categoriaId, {
    fonte: "voce-ja-classificou",
    porque: "Você já classificou assim",
  });

  // ── 2. Você já classificou esta contraparte ──────────────────────────────
  if (alvo.pessoa) {
    const mesmaPessoa = normalizarDescricao(alvo.pessoa);
    const antes = contexto.historico.find(
      (h) => h.pessoa && normalizarDescricao(h.pessoa) === mesmaPessoa,
    );

    somar(antes?.categoriaId, {
      fonte: "mesma-contraparte",
      porque: `Você já classificou ${alvo.pessoa} assim`,
    });
  }

  // ── 3. A categoria do banco, quando ela é específica ─────────────────────
  const doBanco = normalizarDescricao(alvo.categoriaDoBanco ?? "");

  somar(contexto.idPorChave.get(CATEGORIA_DO_BANCO[doBanco] ?? ""), {
    fonte: "categoria-do-banco",
    porque: "O banco classificou como " + doBanco.toLowerCase(),
  });

  // ── 4. O pote do banco, desempatado pelo seu histórico ───────────────────
  const pote = POTE_DO_BANCO[doBanco];

  if (pote) {
    somar(maisUsadaNoPote(contexto.historico, pote), {
      fonte: "pote-do-banco",
      porque: "O banco diz que é " + doBanco.toLowerCase() + ", e é o que você mais usa aí",
    });
  }

  return encontradas.slice(0, MAXIMO);
}

/**
 * O trecho estável (A2) é a chave preferida: a mesma loja em outra cidade tem
 * descrição diferente e trecho igual. Casar pela descrição inteira perderia
 * isso todo mês.
 */
function chaveDaDescricao(descricao: string, origem: Origem): string {
  return trechoEstavel(descricao, origem) ?? normalizarDescricao(descricao);
}

function maisUsadaNoPote(
  historico: Classificado[],
  pote: string,
): string | null {
  const contagem = new Map<string, number>();

  for (const h of historico) {
    if (!h.chaveDaCategoria.startsWith(`${pote}/`)) continue;
    contagem.set(h.categoriaId, (contagem.get(h.categoriaId) ?? 0) + 1);
  }

  let campea: string | null = null;
  let melhor = 0;

  // Empate resolve pelo id, para duas chamadas iguais darem o mesmo
  // resultado — mesma razão da A1.
  for (const [id, n] of [...contagem].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (n > melhor) {
      melhor = n;
      campea = id;
    }
  }

  return campea;
}
