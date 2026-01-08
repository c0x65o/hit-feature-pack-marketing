import { z } from "zod";
// Schema-only module for:
// - PUT /api/marketing/plans/[id]
const uuid = z.string().uuid();
export const putBodySchema = z.object({
    title: z.string().min(1).optional(),
    typeId: uuid.nullable().optional(),
    budgetAmount: z.number().nonnegative().optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    allocateByType: z.boolean().optional(),
    isArchived: z.boolean().optional(),
});
