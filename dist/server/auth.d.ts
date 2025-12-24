import { NextRequest } from 'next/server';
export interface User {
    sub: string;
    email: string;
    roles?: string[];
}
export declare function extractUserFromRequest(request: NextRequest): User | null;
export declare function isAdmin(user: User | null): boolean;
export interface MarketingOptions {
    enable_project_linking?: boolean;
}
export declare function getMarketingOptionsFromRequest(_request: NextRequest): MarketingOptions;
//# sourceMappingURL=auth.d.ts.map