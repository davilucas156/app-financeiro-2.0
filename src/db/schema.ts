import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Schema do banco — fonte de verdade das tabelas.
 *
 * Toda mudança aqui vira um `.sql` versionado em `src/db/migrations/` via
 * `npm run db:generate` — nunca alterar o banco à mão.
 *
 * Ainda por vir: `buckets` e `categories` (C3), `classification_rules` (C5).
 */

/**
 * Usuários.
 *
 * A chave primária é o **`user.id` do Clerk**, não um serial nosso: manter
 * duas identidades para a mesma pessoa é fonte garantida de bug na hora de
 * cruzar sessão com dados.
 *
 * Todos os instantes são `timestamptz`. Sem fuso, um registro feito às 23h em
 * São Paulo e lido de outro fuso cai no dia seguinte — e "mês de referência"
 * é o eixo do produto inteiro.
 */
export const users = pgTable("users", {
  /** `user_2ab…` — vem do Clerk. */
  id: text("id").primaryKey(),

  /** Chave natural e o que a allowlist compara. */
  email: text("email").notNull().unique(),

  /** Nulo de propósito: o perfil do Google pode não ter nome. */
  nome: text("nome"),

  criadoEm: timestamp("criado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),

  /** Atualizado pelo webhook `user.updated` (D4). */
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),

  /**
   * Nulo = onboarding pendente. É o que a D6 lê para mandar o usuário para
   * `/bem-vindo` ou `/dashboard`.
   */
  onboardingConcluidoEm: timestamp("onboarding_concluido_em", {
    withTimezone: true,
  }),

  /**
   * Remoção lógica. O webhook `user.deleted` marca aqui em vez de apagar a
   * linha — apagar levaria junto meses de histórico financeiro.
   */
  removidoEm: timestamp("removido_em", { withTimezone: true }),
});

export type Usuario = typeof users.$inferSelect;
export type NovoUsuario = typeof users.$inferInsert;

/**
 * Potes. Populados no onboarding a partir de
 * `src/features/onboarding/potes-padrao.ts` — o schema foi desenhado para
 * caber naquele módulo sem conversão.
 *
 * Duas restrições de unicidade, com propósitos diferentes:
 * - `(user_id, nome)` impede dois potes com o mesmo rótulo na tela;
 * - `(user_id, slug)` é o que garante a **idempotência do onboarding** (D7).
 *   A idempotência não pode depender do nome, porque na fase 2 o usuário vai
 *   poder renomear os potes — e aí o seed deixaria de se reconhecer.
 */
export const buckets = pgTable(
  "buckets",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** Identidade estável: `custos-fixos`. Não muda se o nome mudar. */
    slug: text("slug").notNull(),

    /** Rótulo exibido — editável pelo usuário na fase 2. */
    nome: text("nome").notNull(),
    emoji: text("emoji").notNull(),
    /** Hex do design system. */
    cor: text("cor").notNull(),

    /**
     * Nulo nos dois potes fora do rateio (Manutenção e Outros/Repasses).
     *
     * Inteiro: o produto trabalha com percentuais cheios. Se a fase 2 aceitar
     * 12,5%, será preciso migration de tipo — limitação consciente.
     */
    percentualMeta: integer("percentual_meta"),

    /** Centavos, como todo dinheiro aqui. */
    valorMetaCentavos: integer("valor_meta_centavos"),

    /** "eventual" / "sem meta" — o que a tela mostra no lugar de "0%". */
    observacao: text("observacao"),

    ordem: integer("ordem").notNull(),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("buckets_user_id_idx").on(t.userId),
    unique("buckets_user_id_nome_unq").on(t.userId, t.nome),
    unique("buckets_user_id_slug_unq").on(t.userId, t.slug),
  ],
);

/**
 * Subcategorias dentro de um pote (gasolina, ônibus, manutenção…).
 *
 * **`user_id` está aqui de propósito, mesmo sendo derivável do pote.**
 * O projeto não tem RLS: o isolamento é manual, e a regra do
 * `references/architecture.md` é "toda query filtra por `user_id` da sessão".
 * Sem esta coluna a regra viraria impossível de seguir literalmente — cada
 * consulta precisaria de um `join` só para provar posse, e qualquer
 * esquecimento vira vazamento entre contas a partir de um `bucket_id` vindo
 * do cliente. O custo é manter os dois campos coerentes na escrita, que
 * acontece num lugar só (D7).
 */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    bucketId: uuid("bucket_id")
      .notNull()
      .references(() => buckets.id, { onDelete: "cascade" }),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    slug: text("slug").notNull(),
    nome: text("nome").notNull(),

    /** Tags visuais do painel original (`t-gas`, `t-fix`…). */
    tagVisual: text("tag_visual"),

    ordem: integer("ordem").notNull(),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("categories_user_id_idx").on(t.userId),
    index("categories_bucket_id_idx").on(t.bucketId),
    unique("categories_bucket_id_nome_unq").on(t.bucketId, t.nome),
    unique("categories_bucket_id_slug_unq").on(t.bucketId, t.slug),
  ],
);

export type Pote = typeof buckets.$inferSelect;
export type NovoPote = typeof buckets.$inferInsert;
export type Categoria = typeof categories.$inferSelect;
export type NovaCategoria = typeof categories.$inferInsert;
