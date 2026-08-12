/**
 * Schema do banco — fonte de verdade das tabelas.
 *
 * As tabelas entram nas próximas tarefas:
 * - `users` → C2
 * - `buckets` e `categories` → C3
 * - `classification_rules` → C5 (adiável)
 *
 * Este arquivo existe desde a C1 para o `drizzle-kit` ter alvo. Toda mudança
 * aqui vira um `.sql` versionado em `src/db/migrations/` via `npm run
 * db:generate` — nunca alterar o banco à mão.
 */

export {};
