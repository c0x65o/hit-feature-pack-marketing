/**
 * Stub for @/lib/feature-pack-schemas
 * 
 * This is a type-only stub for feature pack compilation.
 * At runtime, the consuming application provides the actual implementation
 * via the generated lib/feature-pack-schemas.ts file.
 */

// Re-export from the actual schema file for type checking during build
export {
  marketingPlanTypes,
  marketingActivityTypes,
  marketingCampaignTypes,
  marketingCampaignTypesRelations,
  marketingCampaigns,
  marketingCampaignsRelations,
  marketingPlans,
  marketingVendors,
  marketingExpenses,
  marketingPlanTypeBudgets,
  marketingEntityLinks,
  type MarketingPlanType,
  type InsertMarketingPlanType,
  type MarketingActivityType,
  type InsertMarketingActivityType,
  type MarketingCampaignType,
  type InsertMarketingCampaignType,
  type MarketingCampaign,
  type InsertMarketingCampaign,
  type MarketingPlan,
  type InsertMarketingPlan,
  type MarketingVendor,
  type InsertMarketingVendor,
  type MarketingExpense,
  type InsertMarketingExpense,
  type MarketingPlanTypeBudget,
  type InsertMarketingPlanTypeBudget,
  type MarketingEntityLink,
  type InsertMarketingEntityLink,
  DEFAULT_MARKETING_PLAN_TYPES,
  DEFAULT_MARKETING_ACTIVITY_TYPES,
  DEFAULT_MARKETING_CAMPAIGN_TYPES,
} from '../schema/marketing';
