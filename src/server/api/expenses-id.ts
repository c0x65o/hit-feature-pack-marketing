/**
 * Marketing Expense Detail API
 *
 * GET    - Get expense by id
 * PUT    - Update expense
 * DELETE - Delete expense
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingExpenses, marketingPlans, marketingActivityTypes, marketingVendors } from '@/lib/feature-pack-schemas';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    const [expense] = await db.select().from(marketingExpenses).where(eq(marketingExpenses.id, id as any)).limit(1);
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    return NextResponse.json({ ...expense, amount: Number(expense.amount || 0) });
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select({ id: marketingExpenses.id }).from(marketingExpenses).where(eq(marketingExpenses.id, id as any)).limit(1);
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    if (body.planId) {
      const [plan] = await db.select({ id: marketingPlans.id }).from(marketingPlans).where(eq(marketingPlans.id, body.planId as any)).limit(1);
      if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (body.typeId) {
      const [type] = await db
        .select({ id: marketingActivityTypes.id })
        .from(marketingActivityTypes)
        .where(eq(marketingActivityTypes.id, String(body.typeId)))
        .limit(1);
      if (!type) return NextResponse.json({ error: 'Activity type not found' }, { status: 404 });
    }

    if (body.vendorId) {
      const [vendor] = await db.select({ id: marketingVendors.id }).from(marketingVendors).where(eq(marketingVendors.id, body.vendorId as any)).limit(1);
      if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    if (body.amount !== undefined) {
      const amountNum = Number(body.amount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (body.planId !== undefined) updateData.planId = body.planId || null;
    if (body.typeId !== undefined) updateData.typeId = body.typeId ? String(body.typeId) : null;
    if (body.vendorId !== undefined) updateData.vendorId = body.vendorId || null;
    if (body.occurredAt !== undefined) updateData.occurredAt = new Date(body.occurredAt);
    if (body.amount !== undefined) updateData.amount = String(Number(body.amount));
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.attachmentUrl !== undefined) updateData.attachmentUrl = body.attachmentUrl || null;

    await db.update(marketingExpenses).set(updateData).where(eq(marketingExpenses.id, id as any));
    const [updated] = await db.select().from(marketingExpenses).where(eq(marketingExpenses.id, id as any)).limit(1);
    return NextResponse.json({ ...updated, amount: Number(updated.amount || 0) });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;

    const [existing] = await db.select({ id: marketingExpenses.id }).from(marketingExpenses).where(eq(marketingExpenses.id, id as any)).limit(1);
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    await db.delete(marketingExpenses).where(eq(marketingExpenses.id, id as any));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}


