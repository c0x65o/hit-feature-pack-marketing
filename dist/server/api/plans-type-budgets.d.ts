/**
 * Marketing Plan Type Budgets API
 *
 * GET  - List budgets for a plan with actual spend per activity type
 * POST - Upsert budgets for a plan
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};
export declare function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    items: any[];
}>>;
export declare function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    items: any[];
}>>;
export {};
//# sourceMappingURL=plans-type-budgets.d.ts.map