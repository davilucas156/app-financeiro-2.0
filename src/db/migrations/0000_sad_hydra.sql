CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nome" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"onboarding_concluido_em" timestamp with time zone,
	"removido_em" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
