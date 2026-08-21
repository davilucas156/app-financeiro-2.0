ALTER TABLE "buckets" ADD COLUMN "tipo" text DEFAULT 'gasto' NOT NULL;--> statement-breakpoint
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_tipo_ck" CHECK ("buckets"."tipo" in ('gasto','renda'));