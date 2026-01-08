/**
 * Marketing Config API
 *
 * Returns feature pack options as seen by the current user (from JWT claims).
 * This is used by the UI to decide whether to render optional project linking.
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
export declare function GET(request: NextRequest): Promise<NextResponse<{
    options: {
        enable_project_linking: boolean;
        require_project_linking: boolean;
    };
    projectsInstalled: boolean;
}>>;
//# sourceMappingURL=config.d.ts.map