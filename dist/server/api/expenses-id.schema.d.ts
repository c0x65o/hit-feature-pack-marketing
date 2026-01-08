import { z } from "zod";
export declare const putBodySchema: z.ZodObject<{
    planId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    typeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    vendorId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    occurredAt: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    attachmentUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
//# sourceMappingURL=expenses-id.schema.d.ts.map