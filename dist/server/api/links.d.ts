/**
 * Marketing Links API (optional)
 *
 * This endpoint is gated behind the pack option `enable_project_linking`.
 * Marketing stays standalone; links are never required.
 *
 * GET    /api/marketing/links?marketingEntityType=plan&marketingEntityId=...   -> list links for an entity
 * POST   /api/marketing/links  { marketingEntityType, marketingEntityId, linkedEntityKind, linkedEntityId }
 * DELETE /api/marketing/links?id=... OR same body fields
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
export declare function GET(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    items: any;
}>>;
export declare function POST(request: NextRequest): Promise<NextResponse<any>>;
export declare function DELETE(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
}>>;
//# sourceMappingURL=links.d.ts.map