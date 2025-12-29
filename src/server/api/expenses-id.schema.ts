import { z } from "zod";

// Schema-only module for:
// - PUT /api/marketing/expenses/[id]

const uuid = z.string().uuid();

export const putBodySchema = z.object({
  planId: uuid.nullable().optional(),
  typeId: uuid.nullable().optional(),
  vendorId: uuid.nullable().optional(),
  occurredAt: z.string().datetime().optional(),
  amount: z.number().positive().optional(),
  notes: z.string().nullable().optional(),
  attachmentUrl: z.string().nullable().optional(),
});
