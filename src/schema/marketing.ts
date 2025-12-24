/**
 * Marketing Feature Pack Schema
 *
 * Drizzle table definitions for the Marketing feature pack.
 * This schema gets merged into the project's database.
 *
 * Core entities:
 * - marketingPlans: Budget plans linked to projects
 * - marketingExpenses: Actual spend entries
 * - marketingVendors: Vendor/platform directory
 * - marketingPlanTypes: Plan categorization
 * - marketingPlanTypeBudgets: Budget allocation by activity type
 * - marketingActivityTypes: Activity types for expense categorization
 */

import {
  pgTable,
  varchar,
  text,
  timestamp,
  numeric,
  boolean,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
// Import projects from projects FP - this will be resolved at runtime
// We use a string reference since we can't import cross-pack schemas directly
// The actual FK constraint will be created via migration

/**
 * Marketing Plan Types Table
 * Dynamic types for marketing plans (e.g., "Social Media Campaign", "Influencer Partnership", "Paid Ads")
 */
export const marketingPlanTypes = pgTable('marketing_plan_types', {
  id: varchar('id', { length: 255 }).primaryKey(),
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
  id: varchar('id', { length: 255 }).primaryKey(),
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
 * Stores marketing plans for projects with title, budget amount, and optional dates
 * 
 * Note: projectId references projects.id from the projects feature pack (UUID)
 * The FK constraint is created via migration since we can't reference cross-pack schemas directly
 */
export const marketingPlans = pgTable('marketing_plans', {
  id: varchar('id', { length: 255 }).primaryKey(),
  projectId: varchar('project_id', { length: 255 }).notNull(), // References projects.id (UUID) - FK via migration
  typeId: varchar('type_id', { length: 255 }), // Optional type reference
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
  id: varchar('id', { length: 255 }).primaryKey(),
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
  id: varchar('id', { length: 255 }).primaryKey(),
  projectId: varchar('project_id', { length: 255 }).notNull(), // References projects.id (UUID) - FK via migration
  planId: varchar('plan_id', { length: 255 }), // Optional plan reference
  typeId: varchar('type_id', { length: 255 }), // Type from activity types
  vendorId: varchar('vendor_id', { length: 255 }), // Vendor reference
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
export const marketingPlanTypeBudgets = pgTable(
  'marketing_plan_type_budgets',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    planId: varchar('plan_id', { length: 255 }).notNull(), // References marketingPlans.id
    activityTypeId: varchar('activity_type_id', { length: 255 }).notNull(), // References marketingActivityTypes.id
    typeId: varchar('type_id', { length: 255 }).notNull(), // Alias for activityTypeId for backwards compatibility
    plannedAmount: numeric('planned_amount', { precision: 20, scale: 2 }).notNull(), // Budget amount for this type
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: one budget per type per plan
    uniquePlanType: unique('marketing_plan_type_budgets_unique').on(
      table.planId,
      table.activityTypeId,
    ),
  }),
);

// Marketing Entity Links (for cross-entity linking when enabled)
export const marketingEntityLinks = pgTable('marketing_entity_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  marketingEntityType: text('marketing_entity_type').notNull(), // 'plan', 'expense', etc.
  marketingEntityId: uuid('marketing_entity_id').notNull(),
  linkedEntityKind: text('linked_entity_kind').notNull(), // 'project', 'task', etc.
  linkedEntityId: uuid('linked_entity_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type MarketingPlanType = InferSelectModel<typeof marketingPlanTypes>;
export type InsertMarketingPlanType = InferInsertModel<typeof marketingPlanTypes>;

export type MarketingActivityType = InferSelectModel<typeof marketingActivityTypes>;
export type InsertMarketingActivityType = InferInsertModel<typeof marketingActivityTypes>;

export type MarketingPlan = InferSelectModel<typeof marketingPlans>;
export type InsertMarketingPlan = InferInsertModel<typeof marketingPlans>;

export type MarketingVendor = InferSelectModel<typeof marketingVendors>;
export type InsertMarketingVendor = InferInsertModel<typeof marketingVendors>;

export type MarketingExpense = InferSelectModel<typeof marketingExpenses>;
export type InsertMarketingExpense = InferInsertModel<typeof marketingExpenses>;

export type MarketingPlanTypeBudget = InferSelectModel<typeof marketingPlanTypeBudgets>;
export type InsertMarketingPlanTypeBudget = InferInsertModel<typeof marketingPlanTypeBudgets>;

export type MarketingEntityLink = InferSelectModel<typeof marketingEntityLinks>;
export type InsertMarketingEntityLink = InferInsertModel<typeof marketingEntityLinks>;
