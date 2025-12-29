import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    title: z.ZodString;
    typeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    budgetAmount: z.ZodNumber;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    allocateByType: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    budgetAmount: number;
    typeId?: string | null | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    allocateByType?: boolean | undefined;
}, {
    title: string;
    budgetAmount: number;
    typeId?: string | null | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    allocateByType?: boolean | undefined;
}>;
//# sourceMappingURL=plans.schema.d.ts.map