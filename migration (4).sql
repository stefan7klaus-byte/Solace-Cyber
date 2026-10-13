CREATE TABLE "chat_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL UNIQUE,
	"intent" text NOT NULL,
	"services" jsonb NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"company" text,
	"declined_fields" jsonb NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY,
	"messages" jsonb NOT NULL,
	"draft" jsonb NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_leads" ADD CONSTRAINT "chat_leads_session_id_chat_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id");