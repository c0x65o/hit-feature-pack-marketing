import { z } from "zod";
// Schema-only module for:
// - POST /api/marketing/expenses
const uuid = z.string().uuid();
export const postBodySchema = z.object({
    planId: uuid.nullable().optional(),
    typeId: uuid.nullable().optional(),
    vendorId: uuid.nullable().optional(),
    occurredAt: z.string().datetime(),
    amount: z.number().positive(),
    notes: z.string().nullable().optional(),
    attachmentUrl: z.string().nullable().optional(),
});
