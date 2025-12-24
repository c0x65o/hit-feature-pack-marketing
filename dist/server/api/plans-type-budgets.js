/**
 * Marketing Plan Type Budgets API
 *
 * GET  - List budgets for a plan with actual spend per activity type
 * POST - Upsert budgets for a plan
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingPlans, marketingPlanTypeBudgets, marketingActivityTypes, marketingExpenses, } from '@/lib/feature-pack-schemas';
import { and, eq, sql } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(_request, { params }) {
    try {
        const db = getDb();
        const { id: planId } = await params;
        const [plan] = await db.select({ id: marketingPlans.id }).from(marketingPlans).where(eq(marketingPlans.id, planId)).limit(1);
        if (!plan)
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        const rows = await db
            .select({
            budget: marketingPlanTypeBudgets,
            type: {
                id: marketingActivityTypes.id,
                name: marketingActivityTypes.name,
                color: marketingActivityTypes.color,
                icon: marketingActivityTypes.icon,
            },
        })
            .from(marketingPlanTypeBudgets)
            .leftJoin(marketingActivityTypes, eq(marketingPlanTypeBudgets.activityTypeId, marketingActivityTypes.id))
            .where(eq(marketingPlanTypeBudgets.planId, planId));
        const items = await Promise.all(rows.map(async ({ budget, type }) => {
            const [spendRow] = await db
                .select({ actualAmount: sql `coalesce(sum(${marketingExpenses.amount}), 0)` })
                .from(marketingExpenses)
                .where(and(eq(marketingExpenses.planId, planId), eq(marketingExpenses.typeId, budget.activityTypeId)));
            const plannedAmount = Number(budget.plannedAmount || 0);
            const actualAmount = Number(spendRow?.actualAmount || 0);
            return {
                ...budget,
                plannedAmount,
                actualAmount,
                remainingAmount: plannedAmount - actualAmount,
                type: type || null,
            };
        }));
        return NextResponse.json({ items });
    }
    catch (error) {
        console.error('Error fetching plan type budgets:', error);
        return NextResponse.json({ error: 'Failed to fetch plan type budgets' }, { status: 500 });
    }
}
export async function POST(request, { params }) {
    try {
        const db = getDb();
        const { id: planId } = await params;
        const body = await request.json();
        const entries = Array.isArray(body?.typeBudgets) ? body.typeBudgets : null;
        if (!entries)
            return NextResponse.json({ error: 'typeBudgets must be an array' }, { status: 400 });
        const [plan] = await db.select({ id: marketingPlans.id }).from(marketingPlans).where(eq(marketingPlans.id, planId)).limit(1);
        if (!plan)
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        const now = new Date();
        const results = [];
        for (const entry of entries) {
            const activityTypeId = entry?.activityTypeId || entry?.typeId;
            const plannedAmountRaw = entry?.plannedAmount;
            if (!activityTypeId)
                continue;
            const plannedAmount = Number(plannedAmountRaw ?? 0);
            if (!Number.isFinite(plannedAmount) || plannedAmount < 0)
                continue;
            const [type] = await db
                .select({ id: marketingActivityTypes.id })
                .from(marketingActivityTypes)
                .where(eq(marketingActivityTypes.id, String(activityTypeId)))
                .limit(1);
            if (!type)
                continue;
            const [existing] = await db
                .select({ id: marketingPlanTypeBudgets.id })
                .from(marketingPlanTypeBudgets)
                .where(and(eq(marketingPlanTypeBudgets.planId, planId), eq(marketingPlanTypeBudgets.activityTypeId, String(activityTypeId))))
                .limit(1);
            if (existing) {
                const [updated] = await db
                    .update(marketingPlanTypeBudgets)
                    .set({ plannedAmount: String(plannedAmount), updatedAt: now })
                    .where(eq(marketingPlanTypeBudgets.id, existing.id))
                    .returning();
                results.push(updated);
            }
            else {
                const [created] = await db
                    .insert(marketingPlanTypeBudgets)
                    .values({
                    planId: planId,
                    activityTypeId: String(activityTypeId),
                    plannedAmount: String(plannedAmount),
                    createdAt: now,
                    updatedAt: now,
                })
                    .returning();
                results.push(created);
            }
        }
        return NextResponse.json({ items: results }, { status: 201 });
    }
    catch (error) {
        console.error('Error upserting plan type budgets:', error);
        return NextResponse.json({ error: 'Failed to update budgets' }, { status: 500 });
    }
}
