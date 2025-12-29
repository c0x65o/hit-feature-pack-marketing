import { z } from "zod";
export declare const putBodySchema: z.ZodObject<{
    planId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    typeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    vendorId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    occurredAt: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    attachmentUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    typeId?: string | null | undefined;
    notes?: string | null | undefined;
    planId?: string | null | undefined;
    vendorId?: string | null | undefined;
    occurredAt?: string | undefined;
    amount?: number | undefined;
    attachmentUrl?: string | null | undefined;
}, {
    typeId?: string | null | undefined;
    notes?: string | null | undefined;
    planId?: string | null | undefined;
    vendorId?: string | null | undefined;
    occurredAt?: string | undefined;
    amount?: number | undefined;
    attachmentUrl?: string | null | undefined;
}>;
//# sourceMappingURL=expenses-id.schema.d.ts.map