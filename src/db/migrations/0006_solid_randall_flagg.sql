CREATE TABLE "classification_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tipo_regra" text NOT NULL,
	"criterio" jsonb NOT NULL,
	"chave" text NOT NULL,
	"categoria_id" uuid NOT NULL,
	"prioridade" integer NOT NULL,
	"origem" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classification_rules_user_id_chave_unq" UNIQUE("user_id","chave"),
	CONSTRAINT "classification_rules_tipo_ck" CHECK ("classification_rules"."tipo_regra" in ('descricao_contem','pessoa','valor_direcao')),
	CONSTRAINT "classification_rules_origem_ck" CHECK ("classification_rules"."origem" in ('seed','correcao'))
);
--> statement-breakpoint
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_categoria_id_categories_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "classification_rules_user_id_idx" ON "classification_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "classification_rules_categoria_id_idx" ON "classification_rules" USING btree ("categoria_id");