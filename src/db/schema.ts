import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  Criterio,
  TipoDeRegra,
} from "@/features/classificacao/motor/regras";
import type { FonteDeSugestao } from "@/features/classificacao/motor/sugestoes";
import type { Dialeto } from "@/features/upload/ler-arquivo/grade";
import type { LinhaIgnorada } from "@/features/upload/ler-arquivo/lancamentos";

/**
 * Schema do banco — fonte de verdade das tabelas.
 *
 * Toda mudança aqui vira um `.sql` versionado em `src/db/migrations/` via
 * `npm run db:generate` — nunca alterar o banco à mão.
 *
 * As `classification_rules` chegaram na C1 da spec 03, junto com o motor que
 * as consome — a C5 da spec 01 foi adiada exatamente para isso.
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

/*
 * ⚠ **O tipo nasce quando alguém precisa dele, e não em par.**
 *
 * Havia 18 destes — `X` e `NovoX` para cada tabela, por reflexo — e **10 não
 * eram lidos por ninguém**, nem pelos testes. Não custavam erro: custavam a
 * impressão de que existe uma camada de tipos do banco, quando o que existe é
 * o que cada consulta seleciona.
 *
 * `$inferSelect` e `$inferInsert` estão a uma linha de distância a qualquer
 * momento. Escrever o par antes de precisar é o mesmo que a coluna dormindo:
 * parece preparo e é só peso.
 */
export type Usuario = typeof users.$inferSelect;

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

    /**
     * `gasto` ou `renda` (tarefa C2).
     *
     * Os 8 potes repartem o que você **gasta**. Entrada não cai em pote de
     * gasto: ela forma o total do mês, que é a base dos percentuais.
     *
     * Existe porque `categories.bucket_id` é `not null` — categoria de renda
     * precisa de um pote para pendurar — e `percentual_meta` nulo não serve
     * para escondê-la: Manutenção e Outros já são nulos e aparecem na tela.
     *
     * Default `gasto` porque as 8 linhas que já existiam são todas de gasto,
     * e porque continua sendo a resposta certa depois: um pote é de gasto até
     * alguém dizer o contrário.
     */
    tipo: text("tipo").$type<"gasto" | "renda">().notNull().default("gasto"),

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
    check("buckets_tipo_ck", sql`${t.tipo} in ('gasto','renda')`),
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
    lancamentosImportados: integer("lancamentos_importados")
      .notNull()
      .default(0),

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
    ignoradas: jsonb("ignoradas")
      .$type<LinhaIgnorada[]>()
      .notNull()
      .default([]),

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

    // ── Procedência da classificação (tarefa C3) ───────────────────────────
    //
    // Nasceu de uma pergunta feita seis meses depois: "por que isso caiu em
    // Lazer?". Tudo nulo enquanto o lançamento está pendente.

    /** `regra`, `sugestao` ou `manual`. Nulo = ainda não classificado. */
    classificadoPor: text("classificado_por").$type<
      "regra" | "sugestao" | "manual"
    >(),

    /**
     * Qual regra classificou.
     *
     * ⚠ **`set null`, jamais `cascade`.** O erro é fácil e catastrófico: com
     * cascade, apagar uma regra apagaria os **lançamentos** que ela
     * classificou. Uma regra some; o dinheiro que passou pela conta, não.
     *
     * Sobrevive à edição da regra, porque o id não muda quando o texto muda.
     * Morre quando a regra é apagada — e é por isso que a coluna abaixo
     * existe.
     */
    regraId: uuid("regra_id").references(() => classificationRules.id, {
      onDelete: "set null",
    }),

    /**
     * O que a regra procurava, **congelado no instante da classificação**.
     *
     * Esta é a coluna que faz a C3 cumprir o que promete. A D9 deixa o Davi
     * apagar regra; se a procedência fosse só a chave estrangeira acima, no
     * dia em que ele apagasse uma regra a resposta sumiria para todos os
     * lançamentos que ela classificou — a C3 falharia exatamente no cenário
     * que a D9 cria.
     *
     * Congelada, e não lida da regra ao vivo, porque procedência conta o que
     * era verdade **naquele dia**. Se a regra foi editada depois, o lançamento
     * antigo continua explicado pelo texto que de fato o pegou.
     */
    regraChave: text("regra_chave"),

    /**
     * Qual das quatro fontes da A4 foi aceita.
     *
     * "Sugestão aceita" sozinha não diz de quem era a sugestão, e a diferença
     * é de confiança: "você aceitou o que você mesmo já tinha classificado" e
     * "você aceitou um palpite do banco" são histórias diferentes no dia em
     * que algo deu errado.
     */
    fonteDaSugestao: text("fonte_da_sugestao").$type<FonteDeSugestao>(),

    /** "Quando" é parte de "por quê" — e o "Voltar" da D6 precisa da ordem. */
    classificadoEm: timestamp("classificado_em", { withTimezone: true }),

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

    check("transactions_direcao_ck", sql`${t.direcao} in ('entrada','saida')`),
    check(
      "transactions_status_ck",
      sql`${t.status} in ('importado','revisao_pendente','excluido')`,
    ),
    check(
      "transactions_origem_ck",
      sql`${t.origem} in ('csv_conta','csv_cartao')`,
    ),
    check(
      "transactions_mes_ck",
      sql`${t.mesReferencia} ~ '^[0-9]{4}-[0-9]{2}$'`,
    ),
    check("transactions_valor_ck", sql`${t.valorCentavos} >= 0`),

    // A consulta da D9: "me mostre os 8 lançamentos que esta regra pegou".
    index("transactions_regra_id_idx").on(t.regraId),

    /*
     * Três invariantes de procedência, para não existir estado impossível.
     *
     * Lançamento classificado tem de dizer **como**; lançamento pendente não
     * pode alegar procedência nenhuma.
     *
     * ⚠ Repare que o primeiro check **não** cobre `regra_id`: depois de um
     * `set null` ele fica nulo enquanto `classificado_por` continua `'regra'`.
     * Isso não é inconsistência — é o registro de que a regra foi apagada, e
     * é exatamente por isso que `regra_chave` existe.
     */
    check(
      "transactions_classificacao_ck",
      sql`(${t.categoriaId} is null) = (${t.classificadoPor} is null)`,
    ),
    check(
      "transactions_classificado_por_ck",
      sql`${t.classificadoPor} is null or ${t.classificadoPor} in ('regra','sugestao','manual')`,
    ),
    check(
      "transactions_regra_chave_ck",
      sql`${t.regraChave} is null or ${t.classificadoPor} = 'regra'`,
    ),
    check(
      "transactions_fonte_sugestao_ck",
      sql`${t.fonteDaSugestao} is null or ${t.classificadoPor} = 'sugestao'`,
    ),
  ],
);

export type Transacao = typeof transactions.$inferSelect;
export type NovaTransacao = typeof transactions.$inferInsert;

/**
 * As regras que o motor consome (tarefa C1 — a C5 adiada da spec 01).
 *
 * Uma linha por regra, **por usuário**. A tabela nasce vazia em toda conta e
 * cresce por uso; só a do Davi recebe o seed da A5 no onboarding (D7).
 *
 * ## O `criterio` é jsonb porque os três tipos têm campos diferentes
 *
 * `descricao_contem` tem um termo, `pessoa` tem nome e direção opcional,
 * `valor_direcao` tem faixa e sentido. Três colunas nulas para cada tipo seria
 * uma tabela com dois terços de buracos e nenhuma garantia.
 *
 * O tipo vem da A1, importado. Uma segunda definição divergiria da primeira e
 * o motor deixaria de casar regra sem ninguém entender por quê.
 *
 * `tipoRegra` fica **também** em coluna própria, redundante com o json de
 * propósito: é por ela que o índice e o `check` funcionam, e é ela que a D9
 * usa para agrupar na tela sem abrir cada json.
 */
export const classificationRules = pgTable(
  "classification_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    tipoRegra: text("tipo_regra").$type<TipoDeRegra>().notNull(),

    criterio: jsonb("criterio").$type<Criterio>().notNull(),

    /**
     * A identidade normalizada do critério —
     * `descricao_contem:PAPELARIA DO ZE BETIM`.
     *
     * ⚠ **Única por usuário, e isso carrega duas garantias.** A D7 precisa ser
     * idempotente como o resto do onboarding: rodar o seed duas vezes não pode
     * dobrar as regras. E a D5 não pode criar duplicata: responder "sempre"
     * duas vezes para o mesmo trecho tem de dar uma regra, não duas.
     *
     * Mesmo padrão de `imports.hash` e `transactions.impressao` — a unicidade
     * que torna repetir a operação inofensiva mora no banco, não na esperança.
     *
     * **Para a D9:** editar o texto de uma regra até colidir com outra vai
     * bater aqui. É o comportamento certo — dois critérios iguais com destinos
     * diferentes seriam um empate impossível de explicar — mas a tela deve
     * traduzir para "já existe uma regra procurando por esse texto".
     */
    chave: text("chave").notNull(),

    /**
     * ⚠ **`cascade`, e o motivo é desconfortável.**
     *
     * `set null` deixaria a regra órfã apontando para o nada, que é o que a
     * tarefa proíbe. `restrict` **quebraria apagar o usuário**: `users` já
     * cascateia para `categories`, e um restrict imediato faria a exclusão da
     * conta falhar.
     *
     * Sobra cascade, que tem um defeito real: apagar uma categoria apaga
     * aprendizado em silêncio. O banco garante que não sobra lixo; **quem deve
     * o aviso é a tela.** Quando a fase 2 permitir apagar categoria, ela tem
     * de dizer "isto leva junto 4 regras" antes de confirmar — do mesmo jeito
     * que a B3 mostra quantos pendentes uma regra nova pega.
     */
    categoriaId: uuid("categoria_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),

    /**
     * **Menor vence.** Sem default de propósito.
     *
     * A A5 reservou a faixa: 20 para movimento (passagem, aplicação, imposto),
     * 30 para o comum, e **abaixo de 20 livre para as correções do Davi** —
     * correção de quem olhou o lançamento ganha do que foi semeado de longe.
     * Um default aqui convidaria a esquecer disso.
     */
    prioridade: integer("prioridade").notNull(),

    /**
     * `seed` (veio pronta no onboarding) ou `correcao` (nasceu de uma escolha
     * sua na revisão).
     *
     * Responde "de onde saiu essa regra?" seis meses depois — a mesma pergunta
     * que a C3 responde para a classificação. Regra de seed **pode ser apagada
     * como qualquer outra**: marcar a origem é informação, não proteção.
     */
    origem: text("origem").$type<"seed" | "correcao">().notNull(),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),

    /** A D9 edita categoria e texto; é por aqui que se sabe que mexeram. */
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Toda leitura filtra por usuário — é a primeira cláusula de todo where.
    index("classification_rules_user_id_idx").on(t.userId),
    // A D9 conta quantas regras apontam para cada categoria.
    index("classification_rules_categoria_id_idx").on(t.categoriaId),

    unique("classification_rules_user_id_chave_unq").on(t.userId, t.chave),

    check(
      "classification_rules_tipo_ck",
      sql`${t.tipoRegra} in ('descricao_contem','pessoa','valor_direcao')`,
    ),
    check(
      "classification_rules_origem_ck",
      sql`${t.origem} in ('seed','correcao')`,
    ),
  ],
);

export type NovaRegraSalva = typeof classificationRules.$inferInsert;

/**
 * A sombra da última decisão da revisão (tarefa D6).
 *
 * ## Por que uma tabela, para um botão
 *
 * `UPDATE ... RETURNING` devolve o valor **novo**. No instante em que a decisão
 * grava, o estado anterior deixa de existir — e sem ele o "Voltar" não desfaz,
 * chuta.
 *
 * E o chute é ambíguo de verdade: um pendente da fila pode estar sem categoria
 * e `importado`, sem categoria e `revisao_pendente` (par que se anula), ou
 * **com** categoria e `revisao_pendente` (o valor alto que uma regra
 * classificou). O terceiro é o que não fecha — a categoria que a regra tinha
 * posto foi sobrescrita pela sua, e ir buscá-la na `classification_rules`, que
 * a D9 deixa apagar, é uma dedução de quatro elos.
 *
 * ## Uma linha por usuário
 *
 * Não é log e não é histórico: é o rascunho do último passo. A chave primária
 * ser o `user_id` **é** a promessa do botão — "reabre o anterior", singular.
 * Sem pilha que cresce, sem limpeza agendada.
 *
 * ## Colunas de verdade, não um jsonb
 *
 * `categoria_id` e `regra_id` repetem o `set null` que `transactions` usa. Se a
 * categoria sumir entre decidir e desfazer, o Postgres cuida; num json eu
 * descobriria pelo erro de chave estrangeira na hora de restaurar.
 *
 * ⚠ **Sem os `check`s de `transactions`, de propósito.** O `set null` acima é
 * disparado por um `delete` de categoria; com o check
 * `(categoria_id is null) = (classificado_por is null)` aqui, esse delete
 * falharia. O rascunho de um desfazer não pode ter poder de veto sobre o resto
 * do app — a coerência é garantida no restaurar, que devolve pendente limpo
 * quando a categoria não existe mais.
 */
export const decisionUndo = pgTable("decision_undo", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  /**
   * `cascade`: apagar o envio apaga os lançamentos (spec 02), e não sobra
   * desfazer apontando para algo que não existe mais.
   */
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),

  // ── A sombra exata das oito colunas que a decisão escreve ────────────────

  categoriaId: uuid("categoria_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  classificadoPor: text("classificado_por").$type<
    "regra" | "sugestao" | "manual"
  >(),
  regraId: uuid("regra_id").references(() => classificationRules.id, {
    onDelete: "set null",
  }),
  regraChave: text("regra_chave"),
  fonteDaSugestao: text("fonte_da_sugestao").$type<FonteDeSugestao>(),
  classificadoEm: timestamp("classificado_em", { withTimezone: true }),
  status: text("status")
    .$type<"importado" | "revisao_pendente" | "excluido">()
    .notNull(),
  motivo: text("motivo"),

  // ── O que a tela precisa avisar antes de você tocar em "Voltar" ──────────

  /**
   * Aquela decisão criou uma regra?
   *
   * Desfazer reabre **um** lançamento; a regra fica, e os irmãos que ela pegou
   * seguem classificados. É o que a D6 manda, e é surpreendente se ninguém
   * disser — então a tela diz, **antes**. Avisar depois seria explicar um
   * susto.
   */
  regraCriada: boolean("regra_criada").notNull().default(false),

  /** Quantos irmãos a regra pegou junto, para o aviso ser específico. */
  irmaos: integer("irmaos").notNull().default(0),

  criadoEm: timestamp("criado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A renda que o usuário **declara** para cada mês (tarefa C1 da spec 04).
 *
 * É a régua de todas as metas: `meta = percentual_meta% × renda declarada`.
 *
 * ## Por que declarada, e não medida
 *
 * A medição da spec 04 contra o extrato real: o motor classifica **55%** do
 * dinheiro que sai e só **8%** do que entra. Renda quase não bate regra, e por
 * decisão consciente da A5 — "transferência para si mesmo entrando" pode ser o
 * mesmo dinheiro voltando ou o salário chegando de outro banco.
 *
 * Uma meta calculada sobre a renda medida seria 30% de 8% da verdade, e sairia
 * errada com aparência de certa.
 *
 * ## Uma linha por mês, e não uma na conta
 *
 * A regra que já valeu três vezes nesta base: não reescrever o passado. Uma
 * renda única em `users` faria um aumento em dezembro mudar as metas de julho
 * retroativamente — julho aconteceu com a renda de julho. É também o que torna
 * o comparativo anual possível: sem base por mês, comparar dois meses seria
 * comparar o mesmo número consigo mesmo.
 *
 * ⚠ **Herdar é leitura, não escrita.** O mês que não tem linha mostra a do
 * anterior, por consulta. Gravar a herança seria mais fácil de consultar e
 * criaria uma mentira: doze linhas dizendo "informou R$ 1.200 em dezembro"
 * quando ele informou uma vez, em janeiro — e corrigir janeiro depois não
 * consertaria nenhuma das outras onze.
 */
export const monthlyIncome = pgTable(
  "monthly_income",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** `YYYY-MM`. A ordenação alfabética **é** a cronológica neste formato. */
    mesReferencia: text("mes_referencia").notNull(),

    /**
     * ⚠ **Sem `default`, de propósito.**
     *
     * Linha ausente e linha com zero são estados diferentes: "nunca informou"
     * pede o número e não mostra meta nenhuma; "informou zero" dá meta zero e
     * faz qualquer gasto estourar. Um default apagaria a diferença e faria toda
     * conta nova nascer com metas zeradas.
     */
    rendaCentavos: integer("renda_centavos").notNull(),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    /**
     * A idempotência mora aqui, como em `transactions.impressao` e
     * `classification_rules.chave`: informar duas vezes o mesmo mês atualiza,
     * nunca duplica.
     */
    primaryKey({ columns: [t.userId, t.mesReferencia] }),

    check(
      "monthly_income_mes_ck",
      sql`${t.mesReferencia} ~ '^[0-9]{4}-[0-9]{2}$'`,
    ),
    // Renda negativa não é um mês ruim, é erro de digitação.
    check("monthly_income_valor_ck", sql`${t.rendaCentavos} >= 0`),
  ],
);

/**
 * Os formatos de CSV que **o usuário** ensinou o app a ler (spec 11, tarefa B1).
 *
 * ## Uma tabela nova, e nenhuma alteração nas existentes
 *
 * ⚠ É a Descoberta 1 da spec 11, e ela foi medida: `formato.id` **só aparece em
 * teste**. Nenhum arquivo de produção pergunta de qual banco veio um lançamento
 * — o que atravessa o app é `origem` (`csv_conta`/`csv_cartao`), que `imports` e
 * `transactions` já guardam desde a spec 02.
 *
 * Por isso o multibanco não pede coluna em lugar nenhum. O formato é a **receita
 * de leitura**; o lançamento é o que foi lido, e ele sai igual venha de onde
 * vier.
 *
 * ## Por que os formatos do Inter continuam em código
 *
 * `FORMATOS`, em `ler-arquivo/formatos.ts`, foi **medido em arquivo real** e é
 * o caminho rápido: quando o arquivo bate com um deles, o app não pergunta nada.
 * Esta tabela é o caminho lento, para o banco que ninguém mediu — e o que a
 * pessoa mapeia aqui vira, para ela, tão automático quanto os de código.
 */
export const userFormats = pgTable(
  "user_formats",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** Como aparece numa mensagem de erro: "Extrato da conta do Banco X". */
    nome: text("nome").notNull(),

    /**
     * O banco, escrito como a pessoa o chama.
     *
     * ⚠ **A `/passos` deriva dela a lista do que o app entende** (spec 09), e é
     * por isso que ela é obrigatória aqui como é em `Formato`. Um formato sem
     * banco tiraria a tela de ajuda do lugar.
     */
    banco: text("banco").notNull(),

    origem: text("origem").$type<"csv_conta" | "csv_cartao">().notNull(),

    /** `{ separador, aspas }` — ver `ler-arquivo/grade.ts`. */
    dialeto: jsonb("dialeto").$type<Dialeto>().notNull(),

    /**
     * Papel → **nome** da coluna no arquivo, igual a `Formato.colunas`.
     *
     * ⚠ **Nome e não índice, embora a pessoa aponte índice na tela.** Guardar o
     * índice obrigaria a escrever um segundo caminho de reconhecimento, e
     * quebraria **em silêncio** no dia em que o banco acrescentasse uma coluna
     * à esquerda — o formato continuaria casando e passaria a ler a coluna
     * errada. Por nome ele deixa de casar, e a pessoa vê "não reconheci".
     *
     * A tradução de índice para nome acontece ao salvar, em
     * `formatos-do-usuario/formatoDoUsuario.ts`.
     */
    colunas: jsonb("colunas").$type<Record<string, string>>().notNull(),

    /**
     * O que o sinal negativo significa **neste** arquivo.
     *
     * ⚠ O erro caro da spec 11: lido ao contrário, todo gasto do cartão vira
     * receita e o mês fecha com uma renda inventada. A defesa não é esta coluna
     * — é a prévia que mostrou a consequência antes de a linha ser gravada.
     */
    sinalNegativo: text("sinal_negativo")
      .$type<"entrada" | "saida">()
      .notNull(),

    /** Ver `ler-arquivo/dialetos.ts`. */
    formatoData: text("formato_data").notNull(),
    formatoNumero: text("formato_numero").notNull(),

    /**
     * Descrições que não são gasto nem receita — pagamento de fatura e afins.
     *
     * ⚠ **Nasce vazio, e a tela não pergunta** (pendência 8 da spec 11). É a
     * pergunta que ninguém sabe responder, e a falta dela não produz o desastre:
     * `prepararLancamentos` casa pares que se anulam **por valor e data**, sem
     * olhar texto, e os dois lados caem em revisão. Sem configuração o app
     * pergunta; ele não inventa.
     */
    padroesDePassagem: jsonb("padroes_de_passagem")
      .$type<{ padrao: string; motivo: string }[]>()
      .notNull()
      .default([]),

    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),

    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("user_formats_user_id_idx").on(t.userId),
    /** Dois formatos com o mesmo nome seriam indistinguíveis na `/formatos`. */
    unique("user_formats_user_id_nome_unq").on(t.userId, t.nome),
    check(
      "user_formats_origem_ck",
      sql`${t.origem} in ('csv_conta','csv_cartao')`,
    ),
    check(
      "user_formats_sinal_ck",
      sql`${t.sinalNegativo} in ('entrada','saida')`,
    ),
  ],
);
