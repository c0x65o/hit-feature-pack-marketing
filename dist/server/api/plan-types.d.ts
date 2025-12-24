/**
 * Marketing Plan Types API
 *
 * GET  - List plan types
 * POST - Create plan type (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
export declare function GET(request: NextRequest): Promise<NextResponse<{
    items: any;
}> | NextResponse<{
    error: string;
}>>;
export declare function POST(request: NextRequest): Promise<NextResponse<any>>;
//# sourceMappingURL=plan-types.d.ts.map