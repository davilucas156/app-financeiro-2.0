ALTER TABLE "transactions" ADD COLUMN "classificado_por" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "regra_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "regra_chave" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "fonte_da_sugestao" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "classificado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_regra_id_classification_rules_id_fk" FOREIGN KEY ("regra_id") REFERENCES "public"."classification_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_regra_id_idx" ON "transactions" USING btree ("regra_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_classificacao_ck" CHECK (("transactions"."categoria_id" is null) = ("transactions"."classificado_por" is null));--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_classificado_por_ck" CHECK ("transactions"."classificado_por" is null or "transactions"."classificado_por" in ('regra','sugestao','manual'));--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_regra_chave_ck" CHECK ("transactions"."regra_chave" is null or "transactions"."classificado_por" = 'regra');--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fonte_sugestao_ck" CHECK ("transactions"."fonte_da_sugestao" is null or "transactions"."classificado_por" = 'sugestao');