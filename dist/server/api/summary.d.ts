/**
 * GET /api/marketing/summary
 *
 * Dashboard summary for a month:
 * - totals: planned budget (plans overlapping month), actual spend (expenses in month)
 * - breakdowns: spend by plan (for pie chart)
 */
import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
export declare function GET(request: NextRequest): Promise<NextResponse<{
    month: string;
    range: {
        start: string;
        end: string;
    };
    totals: {
        plannedBudget: number;
        actualSpend: number;
        remaining: number;
        variance: number;
    };
    byPlan: any[];
}> | NextResponse<{
    error: string;
}>>;
//# sourceMappingURL=summary.d.ts.map