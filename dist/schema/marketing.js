/**
 * Marketing Feature Pack Schema
 *
 * Drizzle table definitions for the Marketing feature pack.
 * This schema gets merged into the project's database.
 *
 * Core entities:
 * - marketingPlans: Budget plans (standalone; optionally link to projects via marketingEntityLinks)
 * - marketingExpenses: Actual spend entries
 * - marketingVendors: Vendor/platform directory
 * - marketingPlanTypes: Plan categorization
 * - marketingPlanTypeBudgets: Budget allocation by activity type
 * - marketingActivityTypes: Activity types for expense categorization
 */
import { pgTable, text, varchar, timestamp, numeric, boolean, unique, uuid, index, jsonb, } from 'drizzle-orm/pg-core';
// Note: Marketing is standalone. Optional linking to projects/other entities is handled
// via marketingEntityLinks and gated by a feature flag in feature-pack.yaml.
/**
 * Marketing Plan Types Table
 * Dynamic types for marketing plans (e.g., "Social Media Campaign", "Influencer Partnership", "Paid Ads")
 */
export const marketingPlanTypes = pgTable('marketing_plan_types', {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 100 }).notNull().unique(), // e.g., "social_media", "influencer", "paid_ads"
    name: varchar('name', { length: 255 }).notNull(), // Display label
    description: text('description'),
    color: varchar('color', { length: 50 }), // Badge color
    icon: varchar('icon', { length: 100 }), // Icon name (lucide)
    sortOrder: numeric('sort_order', { precision: 10, scale: 0 }).default('0'),
    isSystem: boolean('is_system').notNull().default(false), // Prevent deleting seeded types
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
/**
 * Marketing Activity Types Table
 * Dynamic activity types for expense categorization
 */
export const marketingActivityTypes = pgTable('marketing_activity_types', {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 100 }).notNull().unique(), // e.g., "video_drop", "sale", "launch"
    name: varchar('name', { length: 255 }).notNull(), // Display label
    category: varchar('category', { length: 50 }), // marketing, release, ops, content
    description: text('description'),
    color: varchar('color', { length: 50 }), // Badge/timeline color
    icon: varchar('icon', { length: 100 }), // Icon name (lucide)
    sortOrder: numeric('sort_order', { precision: 10, scale: 0 }).default('0'),
    isSystem: boolean('is_system').notNull().default(false), // Prevent deleting seeded types
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
/**
 * Marketing Plans Table
 * Stores marketing plans with title, budget amount, and optional dates.
 * Standalone: no projectId required; optional linking is done via marketingEntityLinks.
 */
export const marketingPlans = pgTable('marketing_plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    typeId: uuid('type_id'), // Optional plan type reference
    title: varchar('title', { length: 500 }).notNull(),
    budgetAmount: numeric('budget_amount', { precision: 20, scale: 2 }).notNull(), // Dollar amount for marketing budget
    spendAmount: numeric('spend_amount', { precision: 20, scale: 2 }).notNull().default('0'), // Dollar amount for marketing spend (calculated)
    startDate: timestamp('start_date'), // Optional start date
    endDate: timestamp('end_date'), // Optional end date
    allocateByType: boolean('allocate_by_type').notNull().default(false), // Whether to allocate budget by type
    isArchived: boolean('is_archived').notNull().default(false), // Whether plan is archived
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
/**
 * Marketing Vendors Table
 * Vendor/Platform directory for expense tracking
 */
export const marketingVendors = pgTable('marketing_vendors', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    kind: varchar('kind', { length: 50 }).notNull(), // Platform, Agency, Creator, Other
    link: varchar('link', { length: 500 }), // Optional URL
    contact: varchar('contact', { length: 500 }), // Optional contact info
    notes: text('notes'), // Optional notes
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
/**
 * Marketing Expenses Table
 * Separate expense entries for budget tracking
 */
export const marketingExpenses = pgTable('marketing_expenses', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id'), // Optional plan reference
    typeId: uuid('type_id'), // Optional activity type reference
    vendorId: uuid('vendor_id'), // Optional vendor reference
    occurredAt: timestamp('occurred_at').notNull(), // Expense date (when the expense occurred)
    amount: numeric('amount', { precision: 20, scale: 2 }).notNull(), // Expense amount
    notes: text('notes'), // Optional notes
    attachmentUrl: varchar('attachment_url', { length: 500 }), // Optional attachment URL
    createdBy: varchar('created_by', { length: 255 }), // User ID or null
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
/**
 * Marketing Plan Type Budgets Table
 * Budget allocation by type within a plan
 */
export const marketingPlanTypeBudgets = pgTable('marketing_plan_type_budgets', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id').notNull(), // References marketingPlans.id
    activityTypeId: uuid('activity_type_id').notNull(), // References marketingActivityTypes.id
    plannedAmount: numeric('planned_amount', { precision: 20, scale: 2 }).notNull(), // Budget amount for this type
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    // Unique constraint: one budget per type per plan
    uniquePlanType: unique('marketing_plan_type_budgets_unique').on(table.planId, table.activityTypeId),
}));
// Marketing Entity Links (for cross-entity linking when enabled)
export const marketingEntityLinks = pgTable('marketing_entity_links', {
    id: uuid('id').primaryKey().defaultRandom(),
    marketingEntityType: text('marketing_entity_type').notNull(), // 'plan', 'expense', etc.
    marketingEntityId: uuid('marketing_entity_id').notNull(),
    linkedEntityKind: text('linked_entity_kind').notNull(), // 'project', 'crm.company', etc.
    linkedEntityId: uuid('linked_entity_id').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    uniqueLink: unique('marketing_entity_links_unique').on(table.marketingEntityType, table.marketingEntityId, table.linkedEntityKind, table.linkedEntityId),
    marketingIdx: index('marketing_entity_links_marketing_idx').on(table.marketingEntityType, table.marketingEntityId),
    linkedIdx: index('marketing_entity_links_linked_idx').on(table.linkedEntityKind, table.linkedEntityId),
}));
