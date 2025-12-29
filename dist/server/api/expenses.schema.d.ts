import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    planId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    typeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    vendorId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    occurredAt: z.ZodString;
    amount: z.ZodNumber;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    attachmentUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    occurredAt: string;
    amount: number;
    typeId?: string | null | undefined;
    notes?: string | null | undefined;
    planId?: string | null | undefined;
    vendorId?: string | null | undefined;
    attachmentUrl?: string | null | undefined;
}, {
    occurredAt: string;
    amount: number;
    typeId?: string | null | undefined;
    notes?: string | null | undefined;
    planId?: string | null | undefined;
    vendorId?: string | null | undefined;
    attachmentUrl?: string | null | undefined;
}>;
//# sourceMappingURL=expenses.schema.d.ts.map