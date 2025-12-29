import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    name: z.ZodString;
    kind: z.ZodEnum<["Platform", "Agency", "Creator", "Other"]>;
    link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contact: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    kind: "Platform" | "Agency" | "Creator" | "Other";
    link?: string | null | undefined;
    isActive?: boolean | undefined;
    contact?: string | null | undefined;
    notes?: string | null | undefined;
}, {
    name: string;
    kind: "Platform" | "Agency" | "Creator" | "Other";
    link?: string | null | undefined;
    isActive?: boolean | undefined;
    contact?: string | null | undefined;
    notes?: string | null | undefined;
}>;
//# sourceMappingURL=vendors.schema.d.ts.map