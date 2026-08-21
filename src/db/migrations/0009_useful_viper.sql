CREATE TABLE "decision_undo" (
	"user_id" text PRIMARY KEY NOT NULL,
	"transaction_id" uuid NOT NULL,
	"categoria_id" uuid,
	"classificado_por" text,
	"regra_id" uuid,
	"regra_chave" text,
	"fonte_da_sugestao" text,
	"classificado_em" timestamp with time zone,
	"status" text NOT NULL,
	"motivo" text,
	"regra_criada" boolean DEFAULT false NOT NULL,
	"irmaos" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decision_undo" ADD CONSTRAINT "decision_undo_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_undo" ADD CONSTRAINT "decision_undo_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_undo" ADD CONSTRAINT "decision_undo_categoria_id_categories_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_undo" ADD CONSTRAINT "decision_undo_regra_id_classification_rules_id_fk" FOREIGN KEY ("regra_id") REFERENCES "public"."classification_rules"("id") ON DELETE set null ON UPDATE no action;