import { z } from "zod";
export declare const putBodySchema: z.ZodObject<{
    key: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    key?: string | undefined;
    description?: string | null | undefined;
    color?: string | null | undefined;
    icon?: string | null | undefined;
    sortOrder?: string | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    key?: string | undefined;
    description?: string | null | undefined;
    color?: string | null | undefined;
    icon?: string | null | undefined;
    sortOrder?: string | undefined;
    isActive?: boolean | undefined;
}>;
//# sourceMappingURL=plan-types-id.schema.d.ts.map