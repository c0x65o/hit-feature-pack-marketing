import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    name: z.ZodString;
    kind: z.ZodEnum<{
        Platform: "Platform";
        Agency: "Agency";
        Creator: "Creator";
        Other: "Other";
    }>;
    link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contact: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
//# sourceMappingURL=vendors.schema.d.ts.map