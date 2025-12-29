import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    typeBudgets: z.ZodArray<z.ZodObject<{
        activityTypeId: z.ZodString;
        typeId: z.ZodOptional<z.ZodString>;
        plannedAmount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        activityTypeId: string;
        plannedAmount: number;
        typeId?: string | undefined;
    }, {
        activityTypeId: string;
        plannedAmount: number;
        typeId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    typeBudgets: {
        activityTypeId: string;
        plannedAmount: number;
        typeId?: string | undefined;
    }[];
}, {
    typeBudgets: {
        activityTypeId: string;
        plannedAmount: number;
        typeId?: string | undefined;
    }[];
}>;
//# sourceMappingURL=plans-type-budgets.schema.d.ts.map