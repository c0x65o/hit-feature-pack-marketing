/**
 * Marketing Expenses API
 *
 * GET  - List expenses with filters
 * POST - Create a new expense
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  marketingExpenses,
  marketingPlans,
  marketingActivityTypes,
  marketingVendors,
} from '@/lib/feature-pack-schemas';
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const planId = searchParams.get('planId');
    const typeId = searchParams.get('typeId');
    const vendorId = searchParams.get('vendorId');
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const conditions: any[] = [];
    if (unassignedOnly) {
      conditions.push(isNull(marketingExpenses.planId));
    } else if (planId) {
      conditions.push(eq(marketingExpenses.planId, planId as any));
    }
    if (typeId) conditions.push(eq(marketingExpenses.typeId, String(typeId)));
    if (vendorId) conditions.push(eq(marketingExpenses.vendorId, vendorId as any));
    if (fromDate) conditions.push(gte(marketingExpenses.occurredAt, new Date(fromDate)));
    if (toDate) conditions.push(lte(marketingExpenses.occurredAt, new Date(toDate)));

    let query = db
      .select({
        expense: marketingExpenses,
        plan: {
          id: marketingPlans.id,
          title: marketingPlans.title,
        },
        type: {
          id: marketingActivityTypes.id,
          name: marketingActivityTypes.name,
          color: marketingActivityTypes.color,
        },
        vendor: {
          id: marketingVendors.id,
          name: marketingVendors.name,
          kind: marketingVendors.kind,
        },
      })
      .from(marketingExpenses)
      .leftJoin(marketingPlans, eq(marketingExpenses.planId, marketingPlans.id))
      .leftJoin(marketingActivityTypes, eq(marketingExpenses.typeId, marketingActivityTypes.id))
      .leftJoin(marketingVendors, eq(marketingExpenses.vendorId, marketingVendors.id))
      .orderBy(desc(marketingExpenses.occurredAt), desc(marketingExpenses.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const rows = await query;
    const items = rows.map(({ expense, plan, type, vendor }: any) => ({
      ...expense,
      amount: Number(expense.amount || 0),
      plan: plan || null,
      type: type || null,
      vendor: vendor || null,
    }));

    const includeTotals = searchParams.get('includeTotals') === 'true';
    if (!includeTotals) {
      return NextResponse.json({ items, limit, offset });
    }

    let totalsQuery = db.select({ totalAmount: sql<number>`coalesce(sum(${marketingExpenses.amount}), 0)` }).from(marketingExpenses);
    if (conditions.length > 0) {
      totalsQuery = totalsQuery.where(and(...conditions)) as typeof totalsQuery;
    }
    const [totalsRow] = await totalsQuery;

    return NextResponse.json({
      items,
      limit,
      offset,
      totals: { totalAmount: Number(totalsRow?.totalAmount || 0), count: items.length },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const { planId, typeId, vendorId, occurredAt, amount, notes, attachmentUrl } = body || {};

    if (!occurredAt) return NextResponse.json({ error: 'occurredAt is required' }, { status: 400 });

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }

    if (planId) {
      const [plan] = await db.select({ id: marketingPlans.id }).from(marketingPlans).where(eq(marketingPlans.id, planId as any)).limit(1);
      if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (typeId) {
      const [type] = await db
        .select({ id: marketingActivityTypes.id })
        .from(marketingActivityTypes)
        .where(eq(marketingActivityTypes.id, String(typeId)))
        .limit(1);
      if (!type) return NextResponse.json({ error: 'Activity type not found' }, { status: 404 });
    }

    if (vendorId) {
      const [vendor] = await db.select({ id: marketingVendors.id }).from(marketingVendors).where(eq(marketingVendors.id, vendorId as any)).limit(1);
      if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const now = new Date();
    const [created] = await db
      .insert(marketingExpenses)
      .values({
        planId: planId || null,
        typeId: typeId ? String(typeId) : null,
        vendorId: vendorId || null,
        occurredAt: new Date(occurredAt),
        amount: String(amountNum),
        notes: notes || null,
        attachmentUrl: attachmentUrl || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}


