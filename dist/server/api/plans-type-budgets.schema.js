import { z } from "zod";
// Schema-only module for:
// - POST /api/marketing/plans/[id]/type-budgets
const uuid = z.string().uuid();
const typeBudgetSchema = z.object({
    activityTypeId: uuid,
    typeId: uuid.optional(),
    plannedAmount: z.number().nonnegative(),
});
export const postBodySchema = z.object({
    typeBudgets: z.array(typeBudgetSchema).min(1),
});
