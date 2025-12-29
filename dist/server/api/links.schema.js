import { z } from "zod";
// Schema-only module for:
// - POST /api/marketing/links
export const postBodySchema = z.object({
    marketingEntityType: z.string().min(1),
    marketingEntityId: z.string().min(1),
    linkedEntityKind: z.string().min(1),
    linkedEntityId: z.string().min(1),
});
