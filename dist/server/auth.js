export function extractUserFromRequest(request) {
    // Check cookie first
    let token = request.cookies.get('hit_token')?.value;
    // Fall back to Authorization header
    if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }
    // Check x-user-id header (set by proxy in production)
    const xUserId = request.headers.get('x-user-id');
    if (xUserId) {
        return { sub: xUserId, email: '' };
    }
    if (!token)
        return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        // JWT payload is base64url; convert for atob.
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
        const payload = JSON.parse(atob(base64));
        if (payload.exp && payload.exp * 1000 < Date.now())
            return null;
        return {
            sub: payload.sub,
            email: payload.email || '',
            roles: payload.roles || [],
            featurePacks: payload.featurePacks || {},
        };
    }
    catch {
        return null;
    }
}
export function isAdmin(user) {
    if (!user)
        return false;
    return user.roles?.includes('admin') ?? false;
}
/**
 * Read marketing feature pack options from JWT claims.
 *
 * The HIT auth module places feature pack options under:
 *   user.featurePacks[packName].options
 */
export function getMarketingOptionsFromRequest(request) {
    const user = extractUserFromRequest(request);
    if (!user)
        return {};
    const featurePacks = user.featurePacks || {};
    const packConfig = featurePacks['marketing'] || {};
    const opts = (packConfig.options || {});
    return {
        enable_project_linking: Boolean(opts.enable_project_linking),
        require_project_linking: Boolean(opts.require_project_linking),
    };
}
