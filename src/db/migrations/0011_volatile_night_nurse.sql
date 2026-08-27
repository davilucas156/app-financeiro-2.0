CREATE TABLE "user_formats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"nome" text NOT NULL,
	"banco" text NOT NULL,
	"origem" text NOT NULL,
	"dialeto" jsonb NOT NULL,
	"colunas" jsonb NOT NULL,
	"sinal_negativo" text NOT NULL,
	"formato_data" text NOT NULL,
	"formato_numero" text NOT NULL,
	"padroes_de_passagem" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_formats_user_id_nome_unq" UNIQUE("user_id","nome"),
	CONSTRAINT "user_formats_origem_ck" CHECK ("user_formats"."origem" in ('csv_conta','csv_cartao')),
	CONSTRAINT "user_formats_sinal_ck" CHECK ("user_formats"."sinal_negativo" in ('entrada','saida'))
);
--> statement-breakpoint
ALTER TABLE "user_formats" ADD CONSTRAINT "user_formats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_formats_user_id_idx" ON "user_formats" USING btree ("user_id");