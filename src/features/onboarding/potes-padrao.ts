/**
 * Os potes e categorias que todo usuário novo recebe no onboarding.
 *
 * **Nada aqui foi inventado.** Os potes saem de `references/design-system.md`
 * (extraído do painel HTML) e as categorias saem de dois lugares:
 * das tags `<span class="tag t-*">` dos meses já fechados em
 * `planejamento_anual_davi.html`, e da seção 7 do `readme.md`, que nomeia os
 * estabelecimentos de cada uma.
 *
 * As metas em reais (360/300/180/180/120/60) sobre uma base de R$1.200
 * confirmam os percentuais 30/25/15/15/10/5%.
 *
 * **Dois consumidores, um lugar:** a tela `/bem-vindo` renderiza usando
 * `classeCor`, e o seed do banco (D7) grava usando `hex`, `percentual`,
 * `metaReferenciaCentavos` e as categorias. Duplicar isso garantiria
 * divergência com o tempo.
 *
 * Não é segredo nem regra de negócio sensível — é o que a tela precisa
 * exibir. O que continua exclusivo do servidor é a **gravação** e o `user_id`
 * da sessão (`references/architecture.md`, Thin Client / Fat Server).
 *
 * Dinheiro em centavos inteiros, como no banco.
 */

export type CategoriaPadrao = {
  /** Identidade estável dentro do pote. É o que a D7 usa para não duplicar. */
  slug: string;
  nome: string;
  emoji: string;
  /** Classe de tag do painel original — mantém a identidade visual. */
  tagVisual: string;
  ordem: number;
};

export type PotePadrao = {
  slug: string;
  nome: string;
  emoji: string;
  /**
   * `gasto` ou `renda` (C2).
   *
   * Os 8 potes originais repartem o que sai. O de renda existe porque
   * `categories.bucket_id` é `not null` e entrada precisa de um lugar — ver o
   * comentário em `schema.ts`.
   */
  tipo: "gasto" | "renda";
  /** Para o seed no banco. */
  hex: string;
  /** Para renderizar. Precisa existir como token em `globals.css`. */
  classeCor: string;
  /** `null` nos potes que ficam fora do rateio percentual. */
  percentual: number | null;
  /** `null` quando não há meta fixa. */
  metaReferenciaCentavos: number | null;
  /** Texto exibido quando não há percentual — nunca mostrar "0%". */
  observacao?: string;
  ordem: number;
  categorias: CategoriaPadrao[];
};

export const POTES_PADRAO: PotePadrao[] = [
  {
    slug: "custos-fixos",
    nome: "Custos Fixos",
    emoji: "🏠",
    tipo: "gasto",
    hex: "#FF5000",
    classeCor: "bg-pote-fix",
    percentual: 30,
    metaReferenciaCentavos: 36000,
    ordem: 1,
    categorias: [
      {
        slug: "telefonia",
        nome: "Telefonia",
        emoji: "📱",
        tagVisual: "t-fix",
        ordem: 1,
      },
      {
        slug: "academia",
        nome: "Academia",
        emoji: "🏋",
        tagVisual: "t-fix",
        ordem: 2,
      },
      {
        slug: "assinaturas",
        nome: "Assinaturas",
        emoji: "💳",
        tagVisual: "t-fix",
        ordem: 3,
      },
      {
        slug: "barbearia",
        nome: "Barbearia",
        emoji: "💈",
        tagVisual: "t-fix",
        ordem: 4,
      },
    ],
  },
  {
    slug: "liberdade-financeira",
    nome: "Liberdade Financeira",
    emoji: "📈",
    tipo: "gasto",
    hex: "#00e5a0",
    classeCor: "bg-pote-lib",
    percentual: 25,
    metaReferenciaCentavos: 30000,
    ordem: 2,
    categorias: [
      {
        slug: "aportes",
        nome: "Aportes",
        emoji: "📈",
        tagVisual: "t-inv",
        ordem: 1,
      },
      {
        slug: "reserva",
        nome: "Reserva de emergência",
        emoji: "🏦",
        tagVisual: "t-inv",
        ordem: 2,
      },
    ],
  },
  {
    slug: "conforto-lazer",
    nome: "Conforto & Lazer",
    emoji: "🎮",
    tipo: "gasto",
    hex: "#3d8eff",
    classeCor: "bg-pote-laz",
    percentual: 15,
    metaReferenciaCentavos: 18000,
    ordem: 3,
    categorias: [
      {
        slug: "assinaturas",
        nome: "Assinaturas",
        emoji: "🎧",
        tagVisual: "t-laz",
        ordem: 1,
      },
      {
        slug: "compras-online",
        nome: "Compras online",
        emoji: "📦",
        tagVisual: "t-laz",
        ordem: 2,
      },
      {
        slug: "alimentacao-fora",
        nome: "Alimentação fora",
        emoji: "🍦",
        tagVisual: "t-laz",
        ordem: 3,
      },
      {
        slug: "saidas-eventos",
        nome: "Saídas e eventos",
        emoji: "🎟",
        tagVisual: "t-laz",
        ordem: 4,
      },
    ],
  },
  {
    slug: "metas-sonhos",
    nome: "Metas / Sonhos",
    emoji: "★",
    tipo: "gasto",
    hex: "#ffc94d",
    classeCor: "bg-pote-met",
    percentual: 15,
    metaReferenciaCentavos: 18000,
    ordem: 4,
    // Uma categoria só porque é o que existe hoje no painel. Inventar uma
    // segunda para "ficar simétrico" seria criar dado que você não usa.
    categorias: [
      {
        slug: "giulia",
        nome: "Giulia",
        emoji: "★",
        tagVisual: "t-met",
        ordem: 1,
      },
    ],
  },
  {
    slug: "transporte",
    nome: "Transporte",
    emoji: "🚗",
    tipo: "gasto",
    hex: "#00c8d4",
    classeCor: "bg-pote-tra",
    percentual: 10,
    metaReferenciaCentavos: 12000,
    ordem: 5,
    categorias: [
      {
        slug: "gasolina",
        nome: "Gasolina",
        emoji: "⛽",
        tagVisual: "t-gas",
        ordem: 1,
      },
      {
        slug: "onibus",
        nome: "Ônibus",
        emoji: "🚌",
        tagVisual: "t-tra",
        ordem: 2,
      },
      { slug: "apps", nome: "Apps", emoji: "🚕", tagVisual: "t-tra", ordem: 3 },
      {
        slug: "estacionamento",
        nome: "Estacionamento",
        emoji: "🅿",
        tagVisual: "t-tra",
        ordem: 4,
      },
    ],
  },
  {
    slug: "conhecimento",
    nome: "Conhecimento",
    emoji: "📚",
    tipo: "gasto",
    hex: "#e040a0",
    classeCor: "bg-pote-con",
    percentual: 5,
    metaReferenciaCentavos: 6000,
    ordem: 6,
    categorias: [
      {
        slug: "cursos",
        nome: "Cursos",
        emoji: "🎓",
        tagVisual: "t-con",
        ordem: 1,
      },
      {
        slug: "conteudo-ferramentas",
        nome: "Conteúdo e ferramentas",
        emoji: "📚",
        tagVisual: "t-con",
        ordem: 2,
      },
    ],
  },
  // Os dois abaixo existem no painel com cor, card e barra próprios, mas
  // ficam fora do rateio percentual: manutenção é custo flutuante e
  // "outros" é o balde de repasses e empréstimos.
  {
    slug: "manutencao",
    nome: "Manutenção",
    emoji: "🔧",
    tipo: "gasto",
    hex: "#26c9a0",
    classeCor: "bg-pote-mec",
    percentual: null,
    metaReferenciaCentavos: null,
    observacao: "eventual",
    ordem: 7,
    categorias: [
      {
        slug: "manutencao-veicular",
        nome: "Manutenção veicular",
        emoji: "🔧",
        tagVisual: "t-mec",
        ordem: 1,
      },
      {
        slug: "pecas",
        nome: "Peças",
        emoji: "⚙",
        tagVisual: "t-mec",
        ordem: 2,
      },
    ],
  },
  {
    slug: "outros-repasses",
    nome: "Outros / Repasses",
    emoji: "·",
    tipo: "gasto",
    hex: "#5a5a70",
    classeCor: "bg-pote-out",
    percentual: null,
    metaReferenciaCentavos: null,
    observacao: "sem meta",
    ordem: 8,
    categorias: [
      {
        slug: "repasses",
        nome: "Repasses e empréstimos",
        emoji: "🔁",
        tagVisual: "t-out",
        ordem: 1,
      },
      {
        slug: "avulsos",
        nome: "Avulsos",
        emoji: "·",
        tagVisual: "t-out",
        ordem: 2,
      },
      {
        slug: "multas",
        nome: "Multas",
        emoji: "⚠",
        tagVisual: "t-out",
        ordem: 3,
      },
    ],
  },
  // ── O nono, e o único que não vem do painel original ──────────────────────
  //
  // Entrada não cai em pote de gasto: ela **é** a base sobre a qual os
  // percentuais dos outros oito são calculados. Sem um lugar para ela, as
  // metas em reais não têm de onde sair (pendência 2 da spec 03).
  //
  // Existe como pote porque `categories.bucket_id` é `not null` — categoria
  // de renda precisa de um pote para pendurar — e não porque renda seja um
  // pote de verdade. Daí o `tipo`.
  //
  // ⚠ A cor é **escolha minha**, não herdada: o painel não tem renda. Roxo é a
  // única livre; verde seria o natural para dinheiro entrando e já é
  // Liberdade Financeira.
  {
    slug: "renda",
    nome: "Renda",
    emoji: "💰",
    tipo: "renda",
    hex: "#a78bfa",
    classeCor: "bg-pote-ren",
    percentual: null,
    metaReferenciaCentavos: null,
    observacao: "o que entra",
    ordem: 9,
    categorias: [
      {
        slug: "salario",
        nome: "Salário",
        emoji: "💼",
        tagVisual: "t-out",
        ordem: 1,
      },
      {
        slug: "renda-extra",
        nome: "Renda extra",
        emoji: "💰",
        tagVisual: "t-out",
        ordem: 2,
      },
      {
        slug: "repasse-recebido",
        nome: "Repasse recebido",
        emoji: "🔁",
        tagVisual: "t-out",
        ordem: 3,
      },
    ],
  },
];

/** Os oito que repartem o gasto. É o que as telas de meta e rateio mostram. */
export const POTES_DE_GASTO = POTES_PADRAO.filter((p) => p.tipo === "gasto");

/** Rótulo da meta, para nunca renderizar "0%" nos potes sem percentual. */
export function rotuloMeta(pote: PotePadrao) {
  return pote.percentual === null
    ? (pote.observacao ?? "sem meta")
    : `${pote.percentual}%`;
}
