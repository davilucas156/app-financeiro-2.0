CREATE TABLE "imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"mes_referencia" text NOT NULL,
	"origem" text NOT NULL,
	"nome_arquivo" text NOT NULL,
	"hash" text NOT NULL,
	"url_no_blob" text,
	"lancamentos_importados" integer DEFAULT 0 NOT NULL,
	"linhas_ignoradas" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "imports_user_id_hash_unq" UNIQUE("user_id","hash"),
	CONSTRAINT "imports_origem_ck" CHECK ("imports"."origem" in ('csv_conta','csv_cartao')),
	CONSTRAINT "imports_mes_ck" CHECK ("imports"."mes_referencia" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"import_id" uuid NOT NULL,
	"data" date NOT NULL,
	"descricao_original" text NOT NULL,
	"valor_centavos" integer NOT NULL,
	"direcao" text NOT NULL,
	"status" text DEFAULT 'importado' NOT NULL,
	"motivo" text,
	"par_de" text,
	"mes_referencia" text NOT NULL,
	"origem" text NOT NULL,
	"impressao" text NOT NULL,
	"parcela" text,
	"categoria_do_banco" text,
	"categoria_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_user_id_impressao_unq" UNIQUE("user_id","impressao"),
	CONSTRAINT "transactions_direcao_ck" CHECK ("transactions"."direcao" in ('entrada','saida')),
	CONSTRAINT "transactions_status_ck" CHECK ("transactions"."status" in ('importado','revisao_pendente','excluido')),
	CONSTRAINT "transactions_origem_ck" CHECK ("transactions"."origem" in ('csv_conta','csv_cartao')),
	CONSTRAINT "transactions_mes_ck" CHECK ("transactions"."mes_referencia" ~ '^[0-9]{4}-[0-9]{2}$'),
	CONSTRAINT "transactions_valor_ck" CHECK ("transactions"."valor_centavos" >= 0)
);
--> statement-breakpoint
ALTER TABLE "imports" ADD CONSTRAINT "imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoria_id_categories_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "imports_user_id_idx" ON "imports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_user_mes_idx" ON "transactions" USING btree ("user_id","mes_referencia");--> statement-breakpoint
CREATE INDEX "transactions_import_id_idx" ON "transactions" USING btree ("import_id");