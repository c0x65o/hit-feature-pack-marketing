import type { ActionCheckResult } from '@hit/feature-pack-auth-core/server/lib/action-check';
export declare function checkMarketingAction(request: Request, actionKey: string): Promise<ActionCheckResult>;
export declare function requireMarketingAction(request: Request, actionKey: string): Promise<Response | null>;
//# sourceMappingURL=require-action.d.ts.map