import { checkActionPermission, requireActionPermission, } from '@hit/feature-pack-auth-core/server/lib/action-check';
export async function checkMarketingAction(request, actionKey) {
    return checkActionPermission(request, actionKey, { logPrefix: 'Marketing' });
}
export async function requireMarketingAction(request, actionKey) {
    return requireActionPermission(request, actionKey, { logPrefix: 'Marketing' });
}
