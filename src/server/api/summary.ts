/**
 * GET /api/marketing/summary
 *
 * Dashboard summary for a month:
 * - totals: planned budget (plans overlapping month), actual spend (expenses in month)
 * - breakdowns: spend by plan (for pie chart)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingPlans, marketingExpenses } from '@/lib/feature-pack-schemas';
import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import { resolveMarketingScopeMode } from '../lib/scope-mode';
import { extractUserFromRequest } from '../auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function parseMonth(s: string | null): { year: number; month: number } | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

function startOfMonthUtc(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

function startOfNextMonthUtc(year: number, month: number): Date {
  return month === 12 ? new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)) : new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const user = extractUserFromRequest(request);

    // Check read permission for marketing (dashboard reads both plans and expenses)
    const plansMode = await resolveMarketingScopeMode(request, { entity: 'plans', verb: 'read' });
    const expensesMode = await resolveMarketingScopeMode(request, { entity: 'expenses', verb: 'read' });

    // If both are denied, return empty summary
    if (plansMode === 'none' && expensesMode === 'none') {
      return NextResponse.json({
        month: '',
        range: { start: '', end: '' },
        totals: { plannedBudget: 0, actualSpend: 0, remaining: 0, variance: 0 },
        byPlan: [],
      });
    }

    const monthParam = parseMonth(searchParams.get('month'));
    const now = new Date();
    const year = monthParam?.year ?? now.getUTCFullYear();
    const month = monthParam?.month ?? now.getUTCMonth() + 1;

    const start = startOfMonthUtc(year, month);
    const end = startOfNextMonthUtc(year, month);

    // Build plan conditions with scope filtering
    const planConditions: any[] = [
      eq(marketingPlans.isArchived, false),
      or(isNull(marketingPlans.startDate), lte(marketingPlans.startDate, end))!,
      or(isNull(marketingPlans.endDate), gte(marketingPlans.endDate, start))!,
    ];
    // Plans don't have ownership, so 'own' mode excludes all plans
    if (plansMode === 'own') {
      // Return empty summary for plans
      planConditions.push(sql<boolean>`false`);
    }

    // Build expense conditions with scope filtering
    const expenseConditions: any[] = [
      gte(marketingExpenses.occurredAt, start),
      lte(marketingExpenses.occurredAt, end),
    ];
    if (expensesMode === 'own') {
      const ownerKey = user?.sub || '';
      if (ownerKey) {
        expenseConditions.push(eq(marketingExpenses.createdBy, ownerKey));
      } else {
        expenseConditions.push(sql<boolean>`false`);
      }
    }

    const overlapCondition = and(...planConditions);

    const [plannedRow] = await db
      .select({
        planned: sql<number>`coalesce(sum(${marketingPlans.budgetAmount}), 0)`,
      })
      .from(marketingPlans)
      .where(overlapCondition);

    const [actualRow] = await db
      .select({
        actual: sql<number>`coalesce(sum(${marketingExpenses.amount}), 0)`,
      })
      .from(marketingExpenses)
      .where(and(...expenseConditions));

    const planned = Number(plannedRow?.planned || 0);
    const actual = Number(actualRow?.actual || 0);

    // Spend by plan for the month (includes "Unassigned")
    // Apply expense scope filtering to the join condition
    const expenseJoinConditions: any[] = [
      eq(marketingExpenses.planId, marketingPlans.id),
      gte(marketingExpenses.occurredAt, start),
      lte(marketingExpenses.occurredAt, end),
    ];
    if (expensesMode === 'own') {
      const ownerKey = user?.sub || '';
      if (ownerKey) {
        expenseJoinConditions.push(eq(marketingExpenses.createdBy, ownerKey));
      }
    }

    const byPlanRows = await db
      .select({
        planId: marketingPlans.id,
        title: marketingPlans.title,
        budgetAmount: marketingPlans.budgetAmount,
        spendAmount: sql<number>`coalesce(sum(${marketingExpenses.amount}), 0)`,
      })
      .from(marketingPlans)
      .leftJoin(marketingExpenses, and(...expenseJoinConditions))
      .where(overlapCondition)
      .groupBy(marketingPlans.id, marketingPlans.title, marketingPlans.budgetAmount)
      .orderBy(desc(sql`coalesce(sum(${marketingExpenses.amount}), 0)`));

    // Unassigned expenses (no planId) - apply expense scope filtering
    const unassignedConditions: any[] = [
      isNull(marketingExpenses.planId),
      gte(marketingExpenses.occurredAt, start),
      lte(marketingExpenses.occurredAt, end),
    ];
    if (expensesMode === 'own') {
      const ownerKey = user?.sub || '';
      if (ownerKey) {
        unassignedConditions.push(eq(marketingExpenses.createdBy, ownerKey));
      }
    }

    const [unassignedRow] = await db
      .select({
        spendAmount: sql<number>`coalesce(sum(${marketingExpenses.amount}), 0)`,
      })
      .from(marketingExpenses)
      .where(and(...unassignedConditions));

    const byPlan = [
      ...byPlanRows.map((r: any) => ({
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
  } catch (error) {
    console.error('Error fetching marketing summary:', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}


