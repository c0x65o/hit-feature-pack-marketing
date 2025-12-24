/**
 * Marketing Vendors API
 *
 * GET  - List vendors
 * POST - Create vendor
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
//# sourceMappingURL=vendors.d.ts.map