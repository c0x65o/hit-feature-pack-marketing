import { z } from "zod";
export declare const putBodySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    typeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    budgetAmount: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    allocateByType: z.ZodOptional<z.ZodBoolean>;
    isArchived: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    typeId?: string | null | undefined;
    title?: string | undefined;
    budgetAmount?: number | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    allocateByType?: boolean | undefined;
    isArchived?: boolean | undefined;
}, {
    typeId?: string | null | undefined;
    title?: string | undefined;
    budgetAmount?: number | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    allocateByType?: boolean | undefined;
    isArchived?: boolean | undefined;
}>;
//# sourceMappingURL=plans-id.schema.d.ts.map