import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    planId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    typeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    vendorId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    occurredAt: z.ZodString;
    amount: z.ZodNumber;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    attachmentUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
//# sourceMappingURL=expenses.schema.d.ts.map