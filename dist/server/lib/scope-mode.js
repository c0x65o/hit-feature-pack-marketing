import { checkMarketingAction } from './require-action';
/**
 * Resolve effective scope mode using a tree:
 * - entity override: marketing.{entity}.{verb}.scope.{mode}
 * - marketing default: marketing.{verb}.scope.{mode}
 * - fallback: own
 *
 * Precedence if multiple are granted: most restrictive wins.
 */
export async function resolveMarketingScopeMode(request, args) {
    const { entity, verb } = args;
    const entityPrefix = entity ? `marketing.${entity}.${verb}.scope` : `marketing.${verb}.scope`;
    const globalPrefix = `marketing.${verb}.scope`;
    // Most restrictive wins (first match returned).
    const modes = ['none', 'own', 'ldd', 'any'];
    for (const m of modes) {
        const res = await checkMarketingAction(request, `${entityPrefix}.${m}`);
        if (res.ok)
            return m;
    }
    for (const m of modes) {
        const res = await checkMarketingAction(request, `${globalPrefix}.${m}`);
        if (res.ok)
            return m;
    }
    return 'own';
}
