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
  datePoint: varchar("date_point", { length: 255 }), // Flexible date string like "Spring, Year 12"
  novelId: uuid("novel_id")
    .references(() => novels.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
