/**
 * Os potes que todo usuário novo recebe no onboarding.
 *
 * Fonte: `references/design-system.md`, extraído de
 * `planejamento_anual_davi.html`. As metas em reais (360/300/180/180/120/60)
 * sobre uma base de R$1.200 confirmam os percentuais 30/25/15/15/10/5%.
 *
 * **Dois consumidores, um lugar:** a tela `/bem-vindo` renderiza usando
 * `classeCor`, e o seed do banco (tarefas C3/D7) grava usando `hex`,
 * `percentual` e `metaReferenciaCentavos`. Duplicar isso garantiria
 * divergência com o tempo.
 *
 * Não é segredo nem regra de negócio sensível — é o que a tela precisa
 * exibir. O que continua exclusivo do servidor é a **gravação** e o `user_id`
 * da sessão (`references/architecture.md`, Thin Client / Fat Server).
 *
 * Dinheiro em centavos inteiros, como no banco.
 */
export type PotePadrao = {
  slug: string;
  nome: string;
  emoji: string;
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
};

export const POTES_PADRAO: PotePadrao[] = [
  {
    slug: "custos-fixos",
    nome: "Custos Fixos",
    emoji: "🏠",
    hex: "#FF5000",
    classeCor: "bg-pote-fix",
    percentual: 30,
    metaReferenciaCentavos: 36000,
    ordem: 1,
  },
  {
    slug: "liberdade-financeira",
    nome: "Liberdade Financeira",
    emoji: "📈",
    hex: "#00e5a0",
    classeCor: "bg-pote-lib",
    percentual: 25,
    metaReferenciaCentavos: 30000,
    ordem: 2,
  },
  {
    slug: "conforto-lazer",
    nome: "Conforto & Lazer",
    emoji: "🎮",
    hex: "#3d8eff",
    classeCor: "bg-pote-laz",
    percentual: 15,
    metaReferenciaCentavos: 18000,
    ordem: 3,
  },
  {
    slug: "metas-sonhos",
    nome: "Metas / Sonhos",
    emoji: "★",
    hex: "#ffc94d",
    classeCor: "bg-pote-met",
    percentual: 15,
    metaReferenciaCentavos: 18000,
    ordem: 4,
  },
  {
    slug: "transporte",
    nome: "Transporte",
    emoji: "🚗",
    hex: "#00c8d4",
    classeCor: "bg-pote-tra",
    percentual: 10,
    metaReferenciaCentavos: 12000,
    ordem: 5,
  },
  {
    slug: "conhecimento",
    nome: "Conhecimento",
    emoji: "📚",
    hex: "#e040a0",
    classeCor: "bg-pote-con",
    percentual: 5,
    metaReferenciaCentavos: 6000,
    ordem: 6,
  },
  // Os dois abaixo existem no painel com cor, card e barra próprios, mas
  // ficam fora do rateio percentual: manutenção é custo flutuante e
  // "outros" é o balde de repasses e empréstimos.
  {
    slug: "manutencao",
    nome: "Manutenção",
    emoji: "🔧",
    hex: "#26c9a0",
    classeCor: "bg-pote-mec",
    percentual: null,
    metaReferenciaCentavos: null,
    observacao: "eventual",
    ordem: 7,
  },
  {
    slug: "outros-repasses",
    nome: "Outros / Repasses",
    emoji: "·",
    hex: "#5a5a70",
    classeCor: "bg-pote-out",
    percentual: null,
    metaReferenciaCentavos: null,
    observacao: "sem meta",
    ordem: 8,
  },
];

/** Rótulo da meta, para nunca renderizar "0%" onde não há percentual. */
export function rotuloMeta(pote: PotePadrao) {
  return pote.percentual === null
    ? (pote.observacao ?? "sem meta")
    : `${pote.percentual}%`;
}
