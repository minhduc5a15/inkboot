import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  pgEnum,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

export const timelineTypeEnum = pgEnum('timeline_type', ['event', 'climax', 'twist', 'resolution']);
export const timelineArcEnum = pgEnum('timeline_arc', ['act_1', 'act_2_part_1', 'act_2_part_2', 'act_3']);
export const plotActEnum = pgEnum('plot_act', ['act1', 'act2a', 'act2b', 'act3']);
export const worldTypeEnum = pgEnum('world_type', ['character', 'location', 'organization', 'lore', 'item']);

export const novels = pgTable("novels", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
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
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => {
  return { novelIdx: index("chapters_novel_id_idx").on(table.novelId) };
});

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  type: timelineTypeEnum("type").default("event").notNull(),
  arc: timelineArcEnum("arc").default("act_1").notNull(),
  datePoint: varchar("date_point", { length: 255 }), // Flexible date string like "Spring, Year 12"
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => {
  return { novelIdx: index("timeline_events_novel_id_idx").on(table.novelId) };
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
}, (table) => {
  return { novelIdx: index("writing_logs_novel_id_idx").on(table.novelId) };
});

export const worldEntities = pgTable("world_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .notNull(),
  type: worldTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"), // Detailed notes
  tags: text("tags").array(),
  metadata: jsonb("metadata").$type<{
    age?: number;
    appearance?: string;
    personality?: string;
    history?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => {
  return { novelIdx: index("world_entities_novel_id_idx").on(table.novelId) };
});

export const entityRelations = pgTable("entity_relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceEntityId: uuid("source_entity_id")
    .references(() => worldEntities.id, { onDelete: "cascade" })
    .notNull(),
  targetEntityId: uuid("target_entity_id")
    .references(() => worldEntities.id, { onDelete: "cascade" })
    .notNull(),
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
  act: plotActEnum("act").notNull(),
  position: integer("position").notNull(),
  foreshadowingNotes: text("foreshadowing_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => {
  return { novelIdx: index("plot_cards_novel_id_idx").on(table.novelId) };
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
