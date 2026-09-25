CREATE TYPE "public"."transfer_status" AS ENUM('PENDING', 'SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"initiated_by" uuid NOT NULL,
	"from_acc_id" uuid NOT NULL,
	"to_acc_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"status" "transfer_status" DEFAULT 'PENDING' NOT NULL,
	"failure_reason" varchar(500),
	"idempotency_key" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transfers_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_acc_id_accounts_id_fk" FOREIGN KEY ("from_acc_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_acc_id_accounts_id_fk" FOREIGN KEY ("to_acc_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;