import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    title: z.ZodString;
    typeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    budgetAmount: z.ZodNumber;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    allocateByType: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
//# sourceMappingURL=plans.schema.d.ts.map