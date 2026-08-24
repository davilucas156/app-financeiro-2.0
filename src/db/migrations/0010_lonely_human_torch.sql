CREATE TABLE "monthly_income" (
	"user_id" text NOT NULL,
	"mes_referencia" text NOT NULL,
	"renda_centavos" integer NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_income_user_id_mes_referencia_pk" PRIMARY KEY("user_id","mes_referencia"),
	CONSTRAINT "monthly_income_mes_ck" CHECK ("monthly_income"."mes_referencia" ~ '^[0-9]{4}-[0-9]{2}$'),
	CONSTRAINT "monthly_income_valor_ck" CHECK ("monthly_income"."renda_centavos" >= 0)
);
--> statement-breakpoint
ALTER TABLE "monthly_income" ADD CONSTRAINT "monthly_income_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;