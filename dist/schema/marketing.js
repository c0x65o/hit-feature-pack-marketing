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
 * - marketingCampaignTypes: Campaign type setup (ordered)
 * - marketingCampaigns: Campaign tracking
 */
import { pgTable, text, varchar, timestamp, date, integer, numeric, boolean, unique, uuid, index, jsonb, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
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
 * Marketing Campaign Types Table
 * Stores configurable campaign types used by campaigns.
 */
export const marketingCampaignTypes = pgTable('marketing_campaign_types', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    order: integer('order').notNull(),
    color: varchar('color', { length: 20 }),
    isSystem: boolean('is_system').notNull().default(false),
    customerConfig: jsonb('customer_config'),
    createdByUserId: varchar('created_by_user_id', { length: 255 }).notNull(),
    createdOnTimestamp: timestamp('created_on_timestamp', { withTimezone: true }).defaultNow().notNull(),
    lastUpdatedByUserId: varchar('last_updated_by_user_id', { length: 255 }),
    lastUpdatedOnTimestamp: timestamp('last_updated_on_timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    orderIdx: index('marketing_campaign_types_order_idx').on(table.order),
    codeIdx: index('marketing_campaign_types_code_idx').on(table.code),
    nameUnique: unique('marketing_campaign_types_name_unique').on(table.name),
    createdByIdx: index('marketing_campaign_types_created_by_idx').on(table.createdByUserId),
}));
/**
 * Marketing Campaigns Table
 * Stores marketing campaign records with optional LDD scope.
 */
export const marketingCampaigns = pgTable('marketing_campaigns', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    goals: text('goals'),
    campaignTypeId: uuid('campaign_type_id').references(() => marketingCampaignTypes.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 50 }).notNull().default('planned'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    budgetAmount: numeric('budget_amount', { precision: 20, scale: 2 }),
    divisionId: uuid('division_id'),
    departmentId: uuid('department_id'),
    locationId: uuid('location_id'),
    ownerUserId: varchar('owner_user_id', { length: 255 }),
    createdByUserId: varchar('created_by_user_id', { length: 255 }).notNull(),
    createdOnTimestamp: timestamp('created_on_timestamp', { withTimezone: true }).defaultNow().notNull(),
    lastUpdatedByUserId: varchar('last_updated_by_user_id', { length: 255 }),
    lastUpdatedOnTimestamp: timestamp('last_updated_on_timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    nameIdx: index('marketing_campaigns_name_idx').on(table.name),
    statusIdx: index('marketing_campaigns_status_idx').on(table.status),
    typeIdx: index('marketing_campaigns_type_idx').on(table.campaignTypeId),
    ownerIdx: index('marketing_campaigns_owner_idx').on(table.ownerUserId),
    createdByIdx: index('marketing_campaigns_created_by_idx').on(table.createdByUserId),
    lddIdx: index('marketing_campaigns_ldd_idx').on(table.divisionId, table.departmentId, table.locationId),
}));
export const marketingCampaignTypesRelations = relations(marketingCampaignTypes, ({ many }) => ({
    campaigns: many(marketingCampaigns),
}));
export const marketingCampaignsRelations = relations(marketingCampaigns, ({ one }) => ({
    campaignType: one(marketingCampaignTypes, {
        fields: [marketingCampaigns.campaignTypeId],
        references: [marketingCampaignTypes.id],
    }),
}));
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
    linkedEntityKind: text('linked_entity_kind').notNull(), // 'project', 'crm.prospect', etc.
    linkedEntityId: uuid('linked_entity_id').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    uniqueLink: unique('marketing_entity_links_unique').on(table.marketingEntityType, table.marketingEntityId, table.linkedEntityKind, table.linkedEntityId),
    marketingIdx: index('marketing_entity_links_marketing_idx').on(table.marketingEntityType, table.marketingEntityId),
    linkedIdx: index('marketing_entity_links_linked_idx').on(table.linkedEntityKind, table.linkedEntityId),
}));
/**
 * Default Marketing plan types
 * Seeded via API initialization (when the table is empty).
 */
export const DEFAULT_MARKETING_PLAN_TYPES = [
    {
        key: 'paid_ads',
        name: 'Paid Ads',
        description: 'Paid advertising campaigns (search, display, paid social, etc.)',
        color: '#3b82f6',
        icon: 'megaphone',
        sortOrder: '10',
        isSystem: true,
        isActive: true,
    },
    {
        key: 'social_media',
        name: 'Social Media Campaign',
        description: 'Organic or boosted social campaigns and content pushes',
        color: '#8b5cf6',
        icon: 'share-2',
        sortOrder: '20',
        isSystem: true,
        isActive: true,
    },
    {
        key: 'influencer',
        name: 'Influencer Partnership',
        description: 'Creator/influencer partnerships and sponsored content',
        color: '#ec4899',
        icon: 'users',
        sortOrder: '30',
        isSystem: true,
        isActive: true,
    },
    {
        key: 'pr',
        name: 'PR / Press',
        description: 'PR outreach, press kits, announcements, and media relations',
        color: '#06b6d4',
        icon: 'file-text',
        sortOrder: '40',
        isSystem: true,
        isActive: true,
    },
    {
        key: 'events',
        name: 'Events',
        description: 'Conferences, showcases, conventions, and event activations',
        color: '#f59e0b',
        icon: 'calendar',
        sortOrder: '50',
        isSystem: true,
        isActive: true,
    },
];
/**
 * Default Marketing activity types
 * Seeded via API initialization (when the table is empty).
 */
export const DEFAULT_MARKETING_ACTIVITY_TYPES = [
    {
        key: 'launch',
        name: 'Launch',
        category: 'release',
        description: 'Launch milestone (announcement, release, or major reveal)',
        color: '#10b981',
        icon: 'rocket',
        sortOrder: '10',
        isSystem: true,
        isActive: true,
    },
    {
        key: 'sale',
        name: 'Sale / Discount',
        category: 'marketing',
        description: 'Sale or discount campaign period',
        color: '#f59e0b',
        icon: 'tag',
        sortOrder: '20',
        isSystem: true,
        isActive: true,
    },
    {
        key: 'video_drop',
        name: 'Video Drop',
        category: 'content',
        description: 'Video content release (trailer, gameplay, devlog, etc.)',
        color: '#3b82f6',
        icon: 'video',
        sortOrder: '30',
        isSystem: true,
        isActive: true,
    },
    {
        key: 'press_release',
        name: 'Press Release',
        category: 'marketing',
        description: 'Press release or major announcement distribution',
        color: '#06b6d4',
        icon: 'file-text',
        sortOrder: '40',
        isSystem: true,
        isActive: true,
    },
    {
        key: 'event_participation',
        name: 'Event Participation',
        category: 'marketing',
        description: 'Participation in an event, convention, showcase, or festival',
        color: '#ec4899',
        icon: 'calendar',
        sortOrder: '50',
        isSystem: true,
        isActive: true,
    },
];
/**
 * Default Marketing campaign types
 * Seeded via API initialization (when the table is empty).
 */
export const DEFAULT_MARKETING_CAMPAIGN_TYPES = [
    { code: 'email', name: 'Email Campaign', order: 1, isSystem: true, createdByUserId: 'system' },
    { code: 'webinar', name: 'Webinar', order: 2, isSystem: true, createdByUserId: 'system' },
    { code: 'event', name: 'Event / Trade Show', order: 3, isSystem: true, createdByUserId: 'system' },
    { code: 'content', name: 'Content Marketing', order: 4, isSystem: true, createdByUserId: 'system' },
    { code: 'paid_search', name: 'Paid Search (PPC)', order: 5, isSystem: true, createdByUserId: 'system' },
    { code: 'paid_social', name: 'Paid Social', order: 6, isSystem: true, createdByUserId: 'system' },
    { code: 'organic_social', name: 'Organic Social', order: 7, isSystem: true, createdByUserId: 'system' },
    { code: 'referral', name: 'Referral Program', order: 8, isSystem: true, createdByUserId: 'system' },
    { code: 'direct_mail', name: 'Direct Mail', order: 9, isSystem: true, createdByUserId: 'system' },
    { code: 'other', name: 'Other', order: 10, isSystem: true, createdByUserId: 'system' },
];
