import type { NextRequest } from 'next/server';
export type ScopeMode = 'none' | 'own' | 'ldd' | 'any';
export type ScopeVerb = 'read' | 'write' | 'delete';
export type ScopeEntity = 'plans' | 'expenses' | 'vendors';
/**
 * Resolve effective scope mode using a tree:
 * - entity override: marketing.{entity}.{verb}.scope.{mode}
 * - marketing default: marketing.{verb}.scope.{mode}
 * - fallback: own
 *
 * Precedence if multiple are granted: most restrictive wins.
 */
export declare function resolveMarketingScopeMode(request: NextRequest, args: {
    entity?: ScopeEntity;
    verb: ScopeVerb;
}): Promise<ScopeMode>;
//# sourceMappingURL=scope-mode.d.ts.map