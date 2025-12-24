/**
 * Marketing Plan Detail API
 *
 * GET    - Get plan + its expenses (optionally month-filtered)
 * PUT    - Update plan
 * DELETE - Archive (soft delete) or hard delete depending on query
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};
export declare function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse<any>>;
export declare function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse<any>>;
export declare function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
    deleted: boolean;
}> | NextResponse<{
    success: boolean;
    archived: boolean;
}>>;
export {};
//# sourceMappingURL=plans-id.d.ts.map