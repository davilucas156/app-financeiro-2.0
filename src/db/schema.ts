import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { LinhaIgnorada } from "@/features/upload/ler-arquivo/lancamentos";

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

    /**
     * No painel a categoria aparece como "⛽ Gasolina", "🚌 Ônibus" — o emoji
     * é parte do rótulo, não enfeite do pote. Coluna própria para não sujar
     * o `nome`, que o usuário vai poder editar.
     */
    emoji: text("emoji").notNull(),

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

/**
 * Um registro por **arquivo enviado** (tarefa C2).
 *
 * Não está no `readme.md`. Existe por duas perguntas que nada mais responde:
 * "esse arquivo já foi enviado?" e "o que apagar quando o usuário desfizer?".
 * Sem ela, desfazer viraria adivinhação sobre quais linhas vieram de qual
 * envio.
 */
export const imports = pgTable(
  "imports",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** `YYYY-MM` — o mês que o usuário escolheu na tela. */
    mesReferencia: text("mes_referencia").notNull(),

    origem: text("origem").$type<"csv_conta" | "csv_cartao">().notNull(),

    /** Só para exibir. **Não** é identidade — ver `hash`. */
    nomeArquivo: text("nome_arquivo").notNull(),

    /**
     * SHA-256 do **conteúdo**. É a identidade do arquivo.
     *
     * Do conteúdo e não do nome porque banco chama tudo de `extrato.csv`, e os
     * dois arquivos do Davi já chegaram renomeados por gente.
     */
    hash: text("hash").notNull(),

    /** Nulo até a D1 existir. */
    urlNoBlob: text("url_no_blob"),

    /**
     * O resumo congelado no momento do envio. Fica guardado porque a tela de
     * histórico o mostra meses depois, e recontar exigiria reler o arquivo.
     */
    lancamentosImportados: integer("lancamentos_importados").notNull().default(0),

    /**
     * As linhas que o leitor **não** conseguiu ler — número, motivo e o
     * conteúdo original de cada uma.
     *
     * Guardava só a contagem. "3 linhas ignoradas" dois meses depois não
     * permite fazer nada a respeito: não dá para saber o que ficou de fora,
     * nem se importava. O motivo é a informação; o número é consequência
     * dele, e sai por `.length` — dois lugares guardando o mesmo fato são
     * só duas chances de eles divergirem.
     *
     * São poucas linhas de texto, e não o arquivo inteiro: é o mínimo que
     * responde "o que eu perdi?" sem manter o extrato completo parado em
     * algum lugar.
     */
    ignoradas: jsonb("ignoradas").$type<LinhaIgnorada[]>().notNull().default([]),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("imports_user_id_idx").on(t.userId),
    /** Responde "esse arquivo já foi enviado?" — a idempotência do envio. */
    unique("imports_user_id_hash_unq").on(t.userId, t.hash),
    check("imports_origem_ck", sql`${t.origem} in ('csv_conta','csv_cartao')`),
    check("imports_mes_ck", sql`${t.mesReferencia} ~ '^[0-9]{4}-[0-9]{2}$'`),
  ],
);

/**
 * Lançamentos (tarefa C1).
 *
 * `categoria_id` nasce **nulo** e continua nulo até a spec de classificação:
 * esta funcionalidade lê o extrato, não decide em que pote cada gasto cai.
 */
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** Apagar o envio leva os lançamentos dele — é o desfazer da D5. */
    importId: uuid("import_id")
      .notNull()
      .references(() => imports.id, { onDelete: "cascade" }),

    /**
     * Coluna `date`, lida como **string** `YYYY-MM-DD`.
     *
     * `timestamp` obrigaria a escolher um horário que não existe no extrato, e
     * a leitura no fuso errado moveria o lançamento de dia — às vezes de mês,
     * num produto cujo eixo é o mês de referência.
     */
    data: date("data", { mode: "string" }).notNull(),

    /** Como veio do banco, com o alinhamento por espaço preservado. */
    descricaoOriginal: text("descricao_original").notNull(),

    /** Sempre **positivo**. O sentido está em `direcao`. */
    valorCentavos: integer("valor_centavos").notNull(),

    /**
     * Informação de verdade, não duplicação do sinal: os dois arquivos do
     * Inter usam o sinal com significados opostos (ver A3).
     */
    direcao: text("direcao").$type<"entrada" | "saida">().notNull(),

    status: text("status")
      .$type<"importado" | "revisao_pendente" | "excluido">()
      .notNull()
      .default("importado"),

    /** Por que caiu em revisão, ou por que saiu do cálculo. */
    motivo: text("motivo"),

    /**
     * Impressão do outro lado do par que se anula — **não** um id.
     *
     * Na hora de inserir, o outro lado ainda não tem `id`. A impressão resolve
     * sem exigir duas passadas de escrita, e é estável: sai idêntica se o
     * arquivo for reimportado.
     */
    parDe: text("par_de"),

    /** `YYYY-MM`. Pode diferir do mês da `data` — parcela antiga na fatura. */
    mesReferencia: text("mes_referencia").notNull(),

    origem: text("origem").$type<"csv_conta" | "csv_cartao">().notNull(),

    /** A chave anti-duplicata da A4. */
    impressao: text("impressao").notNull(),

    /** Só do cartão. */
    parcela: text("parcela"),
    categoriaDoBanco: text("categoria_do_banco"),

    /**
     * `set null` e **não** `cascade`: apagar uma categoria não pode apagar
     * meses de histórico financeiro. O lançamento fica, sem categoria.
     */
    categoriaId: uuid("categoria_id").references(() => categories.id, {
      onDelete: "set null",
    }),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("transactions_user_id_idx").on(t.userId),
    index("transactions_user_mes_idx").on(t.userId, t.mesReferencia),
    index("transactions_import_id_idx").on(t.importId),

    /**
     * **A idempotência mora aqui, não num `if`.** Mesma decisão que
     * `(user_id, slug)` tomou pelos potes na D7: duas requisições simultâneas
     * não furam uma restrição de unicidade, e nenhuma checagem em código
     * consegue prometer isso.
     *
     * Com `user_id` junto porque a impressão não inclui o usuário — sem ele,
     * dois usuários com o mesmo lançamento colidiriam, e o segundo perderia um
     * lançamento real por causa do primeiro.
     */
    unique("transactions_user_id_impressao_unq").on(t.userId, t.impressao),

    check(
      "transactions_direcao_ck",
      sql`${t.direcao} in ('entrada','saida')`,
    ),
    check(
      "transactions_status_ck",
      sql`${t.status} in ('importado','revisao_pendente','excluido')`,
    ),
    check("transactions_origem_ck", sql`${t.origem} in ('csv_conta','csv_cartao')`),
    check("transactions_mes_ck", sql`${t.mesReferencia} ~ '^[0-9]{4}-[0-9]{2}$'`),
    check("transactions_valor_ck", sql`${t.valorCentavos} >= 0`),
  ],
);

export type Importacao = typeof imports.$inferSelect;
export type NovaImportacao = typeof imports.$inferInsert;
export type Transacao = typeof transactions.$inferSelect;
export type NovaTransacao = typeof transactions.$inferInsert;
