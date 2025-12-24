/**
 * GET /api/marketing/summary
 *
 * Dashboard summary for a month:
 * - totals: planned budget (plans overlapping month), actual spend (expenses in month)
 * - breakdowns: spend by plan (for pie chart)
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingPlans, marketingExpenses } from '@/lib/feature-pack-schemas';
import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
function parseMonth(s) {
    if (!s)
        return null;
    const m = /^(\d{4})-(\d{2})$/.exec(s.trim());
    if (!m)
        return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12)
        return null;
    return { year, month };
}
function startOfMonthUtc(year, month) {
    return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}
function startOfNextMonthUtc(year, month) {
    return month === 12 ? new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)) : new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
}
export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const monthParam = parseMonth(searchParams.get('month'));
        const now = new Date();
        const year = monthParam?.year ?? now.getUTCFullYear();
        const month = monthParam?.month ?? now.getUTCMonth() + 1;
        const start = startOfMonthUtc(year, month);
        const end = startOfNextMonthUtc(year, month);
        const overlapCondition = and(eq(marketingPlans.isArchived, false), 
        // startDate is null OR startDate < end
        or(isNull(marketingPlans.startDate), lte(marketingPlans.startDate, end)), 
        // endDate is null OR endDate >= start
        or(isNull(marketingPlans.endDate), gte(marketingPlans.endDate, start)));
        const [plannedRow] = await db
            .select({
            planned: sql `coalesce(sum(${marketingPlans.budgetAmount}), 0)`,
        })
            .from(marketingPlans)
            .where(overlapCondition);
        const [actualRow] = await db
            .select({
            actual: sql `coalesce(sum(${marketingExpenses.amount}), 0)`,
        })
            .from(marketingExpenses)
            .where(and(gte(marketingExpenses.occurredAt, start), lte(marketingExpenses.occurredAt, end)));
        const planned = Number(plannedRow?.planned || 0);
        const actual = Number(actualRow?.actual || 0);
        // Spend by plan for the month (includes "Unassigned")
        const byPlanRows = await db
            .select({
            planId: marketingPlans.id,
            title: marketingPlans.title,
            budgetAmount: marketingPlans.budgetAmount,
            spendAmount: sql `coalesce(sum(${marketingExpenses.amount}), 0)`,
        })
            .from(marketingPlans)
            .leftJoin(marketingExpenses, and(eq(marketingExpenses.planId, marketingPlans.id), gte(marketingExpenses.occurredAt, start), lte(marketingExpenses.occurredAt, end)))
            .where(eq(marketingPlans.isArchived, false))
            .groupBy(marketingPlans.id, marketingPlans.title, marketingPlans.budgetAmount)
            .orderBy(desc(sql `coalesce(sum(${marketingExpenses.amount}), 0)`));
        const [unassignedRow] = await db
            .select({
            spendAmount: sql `coalesce(sum(${marketingExpenses.amount}), 0)`,
        })
            .from(marketingExpenses)
            .where(and(isNull(marketingExpenses.planId), gte(marketingExpenses.occurredAt, start), lte(marketingExpenses.occurredAt, end)));
        const byPlan = [
            ...byPlanRows.map((r) => ({
                planId: String(r.planId),
                title: String(r.title || ''),
                budgetAmount: Number(r.budgetAmount || 0),
                spendAmount: Number(r.spendAmount || 0),
            })),
        ];
        const unassigned = Number(unassignedRow?.spendAmount || 0);
        if (unassigned > 0) {
            byPlan.push({ planId: null, title: 'Unassigned', budgetAmount: 0, spendAmount: unassigned });
        }
        return NextResponse.json({
            month: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`,
            range: { start: start.toISOString(), end: end.toISOString() },
            totals: {
                plannedBudget: planned,
                actualSpend: actual,
                remaining: planned - actual,
                variance: actual - planned,
            },
            byPlan,
        });
    }
    catch (error) {
        console.error('Error fetching marketing summary:', error);
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
    }
}
