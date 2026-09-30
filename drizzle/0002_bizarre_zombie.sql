CREATE TYPE "public"."beneficiary_status" AS ENUM('ACTIVE', 'REMOVE');--> statement-breakpoint
CREATE TABLE "beneficiaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"acount_number" varchar(20) NOT NULL,
	"nick_name" varchar NOT NULL,
	"status" "beneficiary_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "beneficiaries_acount_number_unique" UNIQUE("acount_number")
);
--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "owner_user_id_idx" ON "beneficiaries" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "account_number_idx" ON "beneficiaries" USING btree ("acount_number");