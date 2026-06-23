CREATE TYPE "public"."plot_act" AS ENUM('act1', 'act2a', 'act2b', 'act3');--> statement-breakpoint
CREATE TYPE "public"."timeline_arc" AS ENUM('act_1', 'act_2_part_1', 'act_2_part_2', 'act_3');--> statement-breakpoint
CREATE TYPE "public"."timeline_type" AS ENUM('event', 'climax', 'twist', 'resolution');--> statement-breakpoint
CREATE TYPE "public"."world_type" AS ENUM('character', 'location', 'organization', 'lore', 'item');--> statement-breakpoint
CREATE TABLE "chapter_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"order" integer NOT NULL,
	"novel_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"target_entity_id" uuid NOT NULL,
	"relation_type" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plot_card_wiki_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plot_card_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plot_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"novel_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"act" "plot_act" NOT NULL,
	"position" integer NOT NULL,
	"foreshadowing_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"type" timeline_type DEFAULT 'event' NOT NULL,
	"arc" timeline_arc DEFAULT 'act_1' NOT NULL,
	"date_point" varchar(255),
	"novel_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "world_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"novel_id" uuid NOT NULL,
	"type" "world_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"content" text,
	"tags" text[],
	"age" integer,
	"appearance" text,
	"personality" text,
	"history" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"novel_id" uuid NOT NULL,
	"word_count" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chapter_versions" ADD CONSTRAINT "chapter_versions_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_novel_id_novels_id_fk" FOREIGN KEY ("novel_id") REFERENCES "public"."novels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_source_entity_id_world_entities_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "public"."world_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_target_entity_id_world_entities_id_fk" FOREIGN KEY ("target_entity_id") REFERENCES "public"."world_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_card_wiki_relations" ADD CONSTRAINT "plot_card_wiki_relations_plot_card_id_plot_cards_id_fk" FOREIGN KEY ("plot_card_id") REFERENCES "public"."plot_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_card_wiki_relations" ADD CONSTRAINT "plot_card_wiki_relations_entity_id_world_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."world_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_cards" ADD CONSTRAINT "plot_cards_novel_id_novels_id_fk" FOREIGN KEY ("novel_id") REFERENCES "public"."novels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_novel_id_novels_id_fk" FOREIGN KEY ("novel_id") REFERENCES "public"."novels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_entities" ADD CONSTRAINT "world_entities_novel_id_novels_id_fk" FOREIGN KEY ("novel_id") REFERENCES "public"."novels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_logs" ADD CONSTRAINT "writing_logs_novel_id_novels_id_fk" FOREIGN KEY ("novel_id") REFERENCES "public"."novels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chapters_novel_id_idx" ON "chapters" USING btree ("novel_id");--> statement-breakpoint
CREATE INDEX "plot_cards_novel_id_idx" ON "plot_cards" USING btree ("novel_id");--> statement-breakpoint
CREATE INDEX "timeline_events_novel_id_idx" ON "timeline_events" USING btree ("novel_id");--> statement-breakpoint
CREATE INDEX "world_entities_novel_id_idx" ON "world_entities" USING btree ("novel_id");--> statement-breakpoint
CREATE INDEX "writing_logs_novel_id_idx" ON "writing_logs" USING btree ("novel_id");