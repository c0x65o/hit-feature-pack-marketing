import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    typeBudgets: z.ZodArray<z.ZodObject<{
        activityTypeId: z.ZodString;
        typeId: z.ZodOptional<z.ZodString>;
        plannedAmount: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
//# sourceMappingURL=plans-type-budgets.schema.d.ts.map