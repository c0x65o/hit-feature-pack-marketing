import { z } from "zod";
export declare const putBodySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    kind: z.ZodOptional<z.ZodEnum<["Platform", "Agency", "Creator", "Other"]>>;
    link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contact: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    link?: string | null | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    kind?: "Platform" | "Agency" | "Creator" | "Other" | undefined;
    contact?: string | null | undefined;
    notes?: string | null | undefined;
}, {
    link?: string | null | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    kind?: "Platform" | "Agency" | "Creator" | "Other" | undefined;
    contact?: string | null | undefined;
    notes?: string | null | undefined;
}>;
//# sourceMappingURL=vendors-id.schema.d.ts.map