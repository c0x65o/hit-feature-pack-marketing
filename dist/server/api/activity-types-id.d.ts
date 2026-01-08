/**
 * Single Activity Type API
 *
 * GET    - Get an activity type
 * PUT    - Update an activity type (admin)
 * DELETE - Delete an activity type (admin, not system)
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};
export declare function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse<any>>;
export declare function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse<any>>;
export declare function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
}>>;
export {};
//# sourceMappingURL=activity-types-id.d.ts.map