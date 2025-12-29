import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    marketingEntityType: z.ZodString;
    marketingEntityId: z.ZodString;
    linkedEntityKind: z.ZodString;
    linkedEntityId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    marketingEntityType: string;
    marketingEntityId: string;
    linkedEntityKind: string;
    linkedEntityId: string;
}, {
    marketingEntityType: string;
    marketingEntityId: string;
    linkedEntityKind: string;
    linkedEntityId: string;
}>;
//# sourceMappingURL=links.schema.d.ts.map