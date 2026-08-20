import type { Sugestao } from "@/features/classificacao/motor/sugestoes";
import type { Direcao } from "@/features/upload/ler-arquivo/lancamentos";
import type { Origem } from "@/features/upload/ler-arquivo/formatos";

/**
 * Os estados da tela de revisão — **protótipo visual** (B1, B2 e B3).
 *
 * ⚠ **Nenhum nome real.** As descrições têm a **forma** medida nos arquivos do
 * Davi (colunas alinhadas por espaço no cartão, `Tipo: "conteúdo"` na conta),
 * com comerciantes e pessoas inventados. Mesma régua de
 * `references/formatos-de-extrato.md`.
 *
 * Some na D3, quando a tela passar a ler do banco.
 */

export type LancamentoFalso = {
  descricao: string;
  valorCentavos: number;
  direcao: Direcao;
  data: string;
  origem: Origem;
  parcela: string | null;
  /** Palpite do banco. **Nunca** verdade — ver spec 03, descoberta 4. */
  categoriaDoBanco: string | null;
  /** A contraparte, quando é transferência (A3). */
  pessoa: string | null;
  /** O texto que a regra procuraria (A2/A3). `null` quando não dá. */
  trecho: string | null;
  /** Quantos outros pendentes do mês a regra pegaria junto. */
  pegaJunto: number;
  sugestoes: Sugestao[];
};

export type EstadoFalso = {
  mes: string;
  posicao: number;
  total: number;
  lancamento: LancamentoFalso;
  /** Quando preenchido, a tela já está na pergunta de regra (B3). */
  escolhida?: string;
};

/** `pote/categoria`, a mesma chave composta da A4. */
const CHAVE = {
  alimentacaoFora: "conforto-lazer/alimentacao-fora",
  compras: "conforto-lazer/compras-online",
  conteudo: "conhecimento/conteudo-ferramentas",
  repasses: "outros-repasses/repasses",
};

/**
 * O caso **comum**: comerciante do cartão, nenhuma sugestão.
 *
 * A A6 mediu 15 de 17 assim no primeiro mês. É por isso que ele é o padrão da
 * tela: abrir no caso bonito faria o Davi aprovar uma tela que quase nunca vê.
 */
const SEM_SUGESTAO: EstadoFalso = {
  mes: "2026-07",
  posicao: 3,
  total: 17,
  lancamento: {
    descricao: "PAPELARIA DO ZE        BETIM         BRA",
    valorCentavos: 4790,
    direcao: "saida",
    data: "2026-06-18",
    origem: "csv_cartao",
    parcela: null,
    categoriaDoBanco: "COMPRAS",
    pessoa: null,
    trecho: "PAPELARIA DO ZE BETIM",
    pegaJunto: 0,
    sugestoes: [],
  },
};

/** O caso **raro**: 2 de 17. Cada sugestão diz de onde veio (A4). */
const COM_SUGESTOES: EstadoFalso = {
  mes: "2026-07",
  posicao: 5,
  total: 17,
  lancamento: {
    descricao: "LANCHONETE AURORA      BETIM         BRA",
    valorCentavos: 3250,
    direcao: "saida",
    data: "2026-06-21",
    origem: "csv_cartao",
    parcela: null,
    categoriaDoBanco: "RESTAURANTES",
    pessoa: null,
    trecho: "LANCHONETE AURORA BETIM",
    pegaJunto: 2,
    sugestoes: [
      {
        categoriaId: CHAVE.alimentacaoFora,
        fonte: "categoria-do-banco",
        porque: "O banco classificou como restaurantes",
      },
      {
        categoriaId: CHAVE.compras,
        fonte: "voce-ja-classificou",
        porque: "Você já classificou assim",
      },
    ],
  },
};

/** Um Pix: aqui o que identifica não é o quê, é **quem**. */
const PIX: EstadoFalso = {
  mes: "2026-07",
  posicao: 9,
  total: 17,
  lancamento: {
    descricao: 'Pix enviado: "Cp :00000000-Fulana de Tal"',
    valorCentavos: 6500,
    direcao: "saida",
    data: "2026-06-23",
    origem: "csv_conta",
    parcela: null,
    categoriaDoBanco: null,
    pessoa: "Fulana de Tal",
    trecho: "Fulana de Tal",
    pegaJunto: 1,
    sugestoes: [
      {
        categoriaId: CHAVE.repasses,
        fonte: "mesma-contraparte",
        porque: "Você já classificou Fulana de Tal assim",
      },
    ],
  },
};

/** Depois de escolher: a pergunta de virar regra (B3). */
const PERGUNTA_DE_REGRA: EstadoFalso = {
  ...COM_SUGESTOES,
  escolhida: CHAVE.alimentacaoFora,
};

/**
 * Escolheu, mas a descrição não dá trecho estável — a pergunta não aparece.
 *
 * A A6 mediu **zero** casos assim no primeiro mês do Davi. O estado existe
 * porque a spec lista a variação, não porque ele seja provável.
 */
const SEM_TRECHO: EstadoFalso = {
  mes: "2026-07",
  posicao: 12,
  total: 17,
  lancamento: {
    descricao: "0000 0000 000000000",
    valorCentavos: 2000,
    direcao: "saida",
    data: "2026-06-25",
    origem: "csv_conta",
    parcela: null,
    categoriaDoBanco: null,
    pessoa: null,
    trecho: null,
    pegaJunto: 0,
    sugestoes: [],
  },
  escolhida: CHAVE.conteudo,
};

export const ESTADOS = {
  padrao: SEM_SUGESTAO,
  sugestoes: COM_SUGESTOES,
  pix: PIX,
  regra: PERGUNTA_DE_REGRA,
  "sem-trecho": SEM_TRECHO,
  fim: null,
} as const;

export type NomeDoEstado = keyof typeof ESTADOS;

export const NOMES_DOS_ESTADOS = Object.keys(ESTADOS) as NomeDoEstado[];

/** Parâmetro desconhecido cai no padrão, que é o caso comum. */
export function estadoDe(valor: string | undefined): NomeDoEstado {
  return NOMES_DOS_ESTADOS.includes(valor as NomeDoEstado)
    ? (valor as NomeDoEstado)
    : "padrao";
}
