import type { NextRequest } from 'next/server';
import { checkMarketingAction } from './require-action';

export type ScopeMode = 'none' | 'own' | 'ldd' | 'any';
export type ScopeVerb = 'read' | 'write' | 'delete';
export type ScopeEntity = 'plans' | 'expenses' | 'vendors' | 'campaigns';

/**
 * Resolve effective scope mode using a tree:
 * - entity override: marketing.{entity}.{verb}.scope.{mode}
 * - marketing default: marketing.{verb}.scope.{mode}
 * - fallback: own
 *
 * Precedence if multiple are granted: most restrictive wins.
 */
export async function resolveMarketingScopeMode(
  request: NextRequest,
  args: { entity?: ScopeEntity; verb: ScopeVerb }
): Promise<ScopeMode> {
  const { entity, verb } = args;
  const entityPrefix = entity ? `marketing.${entity}.${verb}.scope` : `marketing.${verb}.scope`;
  const globalPrefix = `marketing.${verb}.scope`;

  // Most restrictive wins (first match returned).
  const modes: ScopeMode[] = ['none', 'own', 'ldd', 'any'];

  for (const m of modes) {
    const res = await checkMarketingAction(request, `${entityPrefix}.${m}`);
    if (res.ok) return m;
  }

  for (const m of modes) {
    const res = await checkMarketingAction(request, `${globalPrefix}.${m}`);
    if (res.ok) return m;
  }

  return 'own';
}
