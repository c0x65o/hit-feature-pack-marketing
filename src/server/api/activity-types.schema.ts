import { z } from "zod";

// Schema-only module for:
// - POST /api/marketing/activity-types
// - PUT /api/marketing/activity-types/[id]

export const postBodySchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

export const putBodySchema = z.object({
  key: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  sortOrder: z.string().optional(),
  isActive: z.boolean().optional(),
});
