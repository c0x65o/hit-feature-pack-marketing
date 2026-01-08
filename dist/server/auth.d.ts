import { NextRequest } from 'next/server';
export interface User {
    sub: string;
    email: string;
    roles?: string[];
    featurePacks?: Record<string, any>;
}
export declare function extractUserFromRequest(request: NextRequest): User | null;
export declare function isAdmin(user: User | null): boolean;
export interface MarketingOptions {
    enable_project_linking?: boolean;
    require_project_linking?: boolean;
}
/**
 * Read marketing feature pack options from JWT claims.
 *
 * The HIT auth module places feature pack options under:
 *   user.featurePacks[packName].options
 */
export declare function getMarketingOptionsFromRequest(request: NextRequest): MarketingOptions;
//# sourceMappingURL=auth.d.ts.map