CREATE TABLE "buckets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	"emoji" text NOT NULL,
	"cor" text NOT NULL,
	"percentual_meta" integer,
	"valor_meta_centavos" integer,
	"observacao" text,
	"ordem" integer NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buckets_user_id_nome_unq" UNIQUE("user_id","nome"),
	CONSTRAINT "buckets_user_id_slug_unq" UNIQUE("user_id","slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	"tag_visual" text,
	"ordem" integer NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_bucket_id_nome_unq" UNIQUE("bucket_id","nome"),
	CONSTRAINT "categories_bucket_id_slug_unq" UNIQUE("bucket_id","slug")
);
--> statement-breakpoint
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buckets_user_id_idx" ON "buckets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_bucket_id_idx" ON "categories" USING btree ("bucket_id");