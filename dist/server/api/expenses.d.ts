/**
 * Marketing Expenses API
 *
 * GET  - List expenses with filters
 * POST - Create a new expense
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
export declare function GET(request: NextRequest): Promise<NextResponse<{
    items: any;
    total: number;
    limit: number;
    offset: number;
}> | NextResponse<{
    error: string;
}>>;
export declare function POST(request: NextRequest): Promise<Response>;
//# sourceMappingURL=expenses.d.ts.map