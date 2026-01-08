/**
 * Marketing Config API
 *
 * Returns feature pack options as seen by the current user (from JWT claims).
 * This is used by the UI to decide whether to render optional project linking.
 */
import { NextResponse } from 'next/server';
import { extractUserFromRequest, getMarketingOptionsFromRequest } from '../auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request) {
    const user = extractUserFromRequest(request);
    const opts = getMarketingOptionsFromRequest(request);
    const featurePacks = user?.featurePacks || {};
    const projectsInstalled = Boolean(featurePacks?.projects);
    return NextResponse.json({
        options: {
            enable_project_linking: Boolean(opts.enable_project_linking),
            require_project_linking: Boolean(opts.require_project_linking),
        },
        projectsInstalled,
    });
}
