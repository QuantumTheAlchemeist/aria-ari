import {
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const receiptsSources = pgTable("receipts_sources", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const receiptsLedger = pgTable("receipts_ledger", {
  receiptHash: text("receipt_hash").primaryKey(),
  userId: uuid("user_id").notNull(),
  seq: integer("seq").notNull(),
  kind: text("kind").notNull(),
  prompt: text("prompt").notNull(),
  promptHash: text("prompt_hash").notNull(),
  output: text("output").notNull(),
  outputHash: text("output_hash").notNull(),
  citationIds: jsonb("citation_ids").$type<string[]>().notNull(),
  decision: text("decision"),
  prevHash: text("prev_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
