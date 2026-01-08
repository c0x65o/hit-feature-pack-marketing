/**
 * Marketing Expense Detail API
 *
 * GET    - Get expense by id (with joined plan/vendor/type)
 * PUT    - Update expense
 * DELETE - Delete expense
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
}>>;
export {};
//# sourceMappingURL=expenses-id.d.ts.map