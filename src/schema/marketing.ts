import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// TABLES
// ─────────────────────────────────────────────────────────────────────────────

// Example table - replace with your actual schema
// export const MarketingItems = pgTable('marketing_items', {
//   id: uuid('id').defaultRandom().primaryKey(),
//   name: text('name').notNull(),
//   createdAt: timestamp('created_at').defaultNow().notNull(),
// });

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

// export type MarketingItem = InferSelectModel<typeof MarketingItems>;
// export type InsertMarketingItem = InferInsertModel<typeof MarketingItems>;
