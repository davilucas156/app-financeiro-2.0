import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

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
