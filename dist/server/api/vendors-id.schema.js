import { z } from "zod";
// Schema-only module for:
// - PUT /api/marketing/vendors/[id]
export const putBodySchema = z.object({
    name: z.string().min(1).optional(),
    kind: z.enum(["Platform", "Agency", "Creator", "Other"]).optional(),
    link: z.string().nullable().optional(),
    contact: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
});
