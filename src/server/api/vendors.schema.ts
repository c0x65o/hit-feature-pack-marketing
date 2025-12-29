import { z } from "zod";

// Schema-only module for:
// - POST /api/marketing/vendors

export const postBodySchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["Platform", "Agency", "Creator", "Other"]),
  link: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
