import { z } from "zod";

// Schema-only module for:
// - POST /api/marketing/plans

const uuid = z.string().uuid();

export const postBodySchema = z.object({
  title: z.string().min(1),
  typeId: uuid.nullable().optional(),
  budgetAmount: z.number().nonnegative(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  allocateByType: z.boolean().optional(),
});
