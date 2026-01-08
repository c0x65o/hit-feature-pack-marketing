import type { NextRequest } from 'next/server';
export type MarketingEntityType = 'plan' | 'expense';
export declare function isUuid(s: string): boolean;
export declare function getProjectLinkingPolicy(request: NextRequest): {
    enabled: boolean;
    required: boolean;
};
export declare function getLinkedProjectId(db: any, marketingEntityType: MarketingEntityType, marketingEntityId: string): Promise<string | null>;
export declare function setLinkedProjectId(db: any, marketingEntityType: MarketingEntityType, marketingEntityId: string, projectId: string | null): Promise<void>;
//# sourceMappingURL=project-linking.d.ts.map