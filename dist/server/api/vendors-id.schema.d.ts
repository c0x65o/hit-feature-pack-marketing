import { z } from "zod";
export declare const putBodySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    kind: z.ZodOptional<z.ZodEnum<{
        Other: "Other";
        Platform: "Platform";
        Agency: "Agency";
        Creator: "Creator";
    }>>;
    link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contact: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
//# sourceMappingURL=vendors-id.schema.d.ts.map