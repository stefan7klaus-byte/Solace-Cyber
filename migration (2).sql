CREATE TABLE "article_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"article_key" text NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"image_key" text,
	"image_alt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"rating" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "article_comments_article_created_idx" ON "article_comments" ("article_key","created_at");--> statement-breakpoint
CREATE INDEX "community_posts_created_idx" ON "community_posts" ("created_at");--> statement-breakpoint
CREATE INDEX "community_reviews_created_idx" ON "community_reviews" ("created_at");