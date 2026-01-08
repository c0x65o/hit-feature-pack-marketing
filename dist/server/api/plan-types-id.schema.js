import { z } from "zod";
// Schema-only module for:
// - PUT /api/marketing/plan-types/[id]
export const putBodySchema = z.object({
    key: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    sortOrder: z.string().optional(),
    isActive: z.boolean().optional(),
});
