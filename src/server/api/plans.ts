/**
 * Marketing Plans API
 *
 * GET  - List plans
 * POST - Create a plan
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingPlans, marketingPlanTypes, marketingExpenses } from '@/lib/feature-pack-schemas';
import { and, asc, desc, eq, gte, inArray, isNull, like, lte, or, sql, type AnyColumn } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function monthWindowUtc(now: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const includeArchived = searchParams.get('includeArchived') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = (searchParams.get('search') || '').trim();
    const sortBy = (searchParams.get('sortBy') || 'createdAt').trim();
    const sortOrder = (searchParams.get('sortOrder') || 'desc').trim();

    const sortColumns: Record<string, AnyColumn> = {
      title: marketingPlans.title,
      createdAt: marketingPlans.createdAt,
      updatedAt: marketingPlans.updatedAt,
      budgetAmount: marketingPlans.budgetAmount,
      isArchived: marketingPlans.isArchived,
    };
    const orderCol = sortColumns[sortBy] ?? marketingPlans.createdAt;
    const orderDirection = sortOrder === 'asc' ? asc(orderCol) : desc(orderCol);

    const conditions: any[] = [];
    if (!includeArchived) {
      conditions.push(eq(marketingPlans.isArchived, false));
    }
    if (search) {
      conditions.push(or(like(marketingPlans.title, `%${search}%`))!);
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db
      .select({
        plan: marketingPlans,
        type: {
          id: marketingPlanTypes.id,
          name: marketingPlanTypes.name,
          color: marketingPlanTypes.color,
        },
      })
      .from(marketingPlans)
      .leftJoin(marketingPlanTypes, eq(marketingPlans.typeId, marketingPlanTypes.id))
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      query = query.where(whereClause) as typeof query;
    }

    // Total count (for pagination UI)
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(marketingPlans);
    const [countRow] = whereClause ? await countQuery.where(whereClause) : await countQuery;
    const total = Number(countRow?.count || 0);

    const rows = await query;
    const plans = rows.map(({ plan, type }: any) => ({ ...plan, type: type || null }));

    const now = new Date();
    const { start, end } = monthWindowUtc(now);
    const planIds = plans.map((p: any) => p?.id).filter(Boolean);

    const spendByPlan: Record<string, number> = {};
    if (planIds.length > 0) {
      const spendRows = await db
        .select({
          planId: marketingExpenses.planId,
          spendAmount: sql<number>`coalesce(sum(${marketingExpenses.amount}), 0)`,
        })
        .from(marketingExpenses)
        .where(
          and(
            inArray(marketingExpenses.planId, planIds as any),
            gte(marketingExpenses.occurredAt, start),
            lte(marketingExpenses.occurredAt, end)
          )
        )
        .groupBy(marketingExpenses.planId);

      for (const r of spendRows) {
        if (r.planId) spendByPlan[String(r.planId)] = Number(r.spendAmount || 0);
      }
    }

    const items = plans.map((p: any) => ({
      ...p,
      budgetAmount: Number(p.budgetAmount || 0),
      monthSpendAmount: Number(spendByPlan[String(p.id)] || 0),
    }));

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const { title, typeId, budgetAmount, startDate, endDate, allocateByType = false } = body || {};

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const budgetNum = Number(budgetAmount ?? 0);
    if (!Number.isFinite(budgetNum) || budgetNum < 0) {
      return NextResponse.json({ error: 'budgetAmount must be a valid non-negative number' }, { status: 400 });
    }

    if (typeId) {
      const [type] = await db
        .select({ id: marketingPlanTypes.id })
        .from(marketingPlanTypes)
        .where(eq(marketingPlanTypes.id, String(typeId)))
        .limit(1);
      if (!type) return NextResponse.json({ error: 'Plan type not found' }, { status: 404 });
    }

    const now = new Date();

    const [created] = await db
      .insert(marketingPlans)
      .values({
        id: randomUUID(),
        title: String(title).trim(),
        typeId: typeId ? String(typeId) : null,
        budgetAmount: String(budgetNum),
        spendAmount: '0', // Initial spend is zero, updated as expenses are added
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        allocateByType: Boolean(allocateByType),
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}


