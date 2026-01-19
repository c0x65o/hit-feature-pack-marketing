/**
 * Marketing Campaigns API
 *
 * GET  - List campaigns
 * POST - Create a new campaign
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
export declare function GET(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    items: any;
    total: number;
    limit: number;
    offset: number;
}>>;
export declare function POST(request: NextRequest): Promise<Response>;
//# sourceMappingURL=campaigns.d.ts.map