import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const novels = pgTable("novels", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"), // Lưu JSON của Tiptap
  order: integer("order").notNull(),
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  age: integer("age"),
  appearance: text("appearance"),
  personality: text("personality"),
  history: text("history"),
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  type: varchar("type", { length: 50 }).default("event").notNull(), // 'event', 'climax', 'twist', 'resolution'
  arc: varchar("arc", { length: 50 }).default("act_1").notNull(), // 'act_1', 'act_2_part_1', 'act_2_part_2', 'act_3'
  datePoint: varchar("date_point", { length: 255 }), // Flexible date string like "Spring, Year 12"
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chapterVersions = pgTable("chapter_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id")
    .references(() => chapters.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const writingLogs = pgTable("writing_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .notNull(),
  wordCount: integer("word_count").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const worldEntities = pgTable("world_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'location', 'organization', 'lore', 'item'
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"), // Detailed notes
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const entityRelations = pgTable("entity_relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceEntityId: uuid("source_entity_id").notNull(),
  targetEntityId: uuid("target_entity_id").notNull(),
  relationType: varchar("relation_type", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plotCards = pgTable("plot_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  act: varchar("act", { length: 50 }).notNull(), // 'act1', 'act2a', 'act2b', 'act3'
  position: integer("position").notNull(),
  foreshadowingNotes: text("foreshadowing_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const plotCardWikiRelations = pgTable("plot_card_wiki_relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  plotCardId: uuid("plot_card_id")
    .references(() => plotCards.id, { onDelete: "cascade" })
    .notNull(),
  entityId: uuid("entity_id")
    .references(() => worldEntities.id, { onDelete: "cascade" })
    .notNull(),
});

