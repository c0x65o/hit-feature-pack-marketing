/**
 * Marketing Plan Detail API
 *
 * GET    - Get plan + its expenses (optionally month-filtered)
 * PUT    - Update plan
 * DELETE - Archive (soft delete) or hard delete depending on query
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingPlans, marketingPlanTypes, marketingExpenses, marketingActivityTypes, marketingVendors, marketingEntityLinks, } from '@/lib/feature-pack-schemas';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { getProjectLinkingPolicy, getLinkedProjectId, isUuid, setLinkedProjectId } from '../lib/project-linking';
import { resolveMarketingScopeMode } from '../lib/scope-mode';
import { extractUserFromRequest } from '../auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const user = extractUserFromRequest(request);
        // Check read permission and resolve scope mode
        const mode = await resolveMarketingScopeMode(request, { entity: 'plans', verb: 'read' });
        if (mode === 'none') {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }
        const [row] = await db
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
            .where(eq(marketingPlans.id, id))
            .limit(1);
        if (!row)
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        // Scope mode check: 'own' mode denies access since plans have no ownership field
        if (mode === 'own') {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }
        // 'any' and 'ldd' modes allow access
        const conditions = [eq(marketingExpenses.planId, id)];
        if (fromDate)
            conditions.push(gte(marketingExpenses.occurredAt, new Date(fromDate)));
        if (toDate)
            conditions.push(lte(marketingExpenses.occurredAt, new Date(toDate)));
        const expensesRows = await db
            .select({
            expense: marketingExpenses,
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
            .leftJoin(marketingActivityTypes, eq(marketingExpenses.typeId, marketingActivityTypes.id))
            .leftJoin(marketingVendors, eq(marketingExpenses.vendorId, marketingVendors.id))
            .where(and(...conditions))
            .orderBy(desc(marketingExpenses.occurredAt), desc(marketingExpenses.createdAt));
        const expenses = expensesRows.map(({ expense, type, vendor }) => ({
            ...expense,
            amount: Number(expense.amount || 0),
            type: type || null,
            vendor: vendor || null,
        }));
        const [spendRow] = await db
            .select({ actualAmount: sql `coalesce(sum(${marketingExpenses.amount}), 0)` })
            .from(marketingExpenses)
            .where(eq(marketingExpenses.planId, id));
        const budget = Number(row.plan.budgetAmount || 0);
        const actual = Number(spendRow?.actualAmount || 0);
        const { enabled: linkingEnabled } = getProjectLinkingPolicy(request);
        const projectId = linkingEnabled ? await getLinkedProjectId(db, 'plan', id) : null;
        return NextResponse.json({
            ...row.plan,
            budgetAmount: budget,
            actualSpendAmount: actual,
            remainingAmount: budget - actual,
            type: row.type || null,
            expenses,
            projectId,
        });
    }
    catch (error) {
        console.error('Error fetching plan:', error);
        return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
    }
}
export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const user = extractUserFromRequest(request);
        // Check write permission and resolve scope mode
        const mode = await resolveMarketingScopeMode(request, { entity: 'plans', verb: 'write' });
        if (mode === 'none') {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }
        const [existing] = await db
            .select({ id: marketingPlans.id })
            .from(marketingPlans)
            .where(eq(marketingPlans.id, id))
            .limit(1);
        if (!existing)
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        // Scope mode check: 'own' mode denies access since plans have no ownership field
        if (mode === 'own') {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }
        // 'any' and 'ldd' modes allow access
        const { enabled: linkingEnabled, required: linkingRequired } = getProjectLinkingPolicy(request);
        // Optional project link update
        const projectIdStr = body.projectId !== undefined && body.projectId !== null ? String(body.projectId).trim() : '';
        if (linkingEnabled && linkingRequired && body.projectId !== undefined && !projectIdStr) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }
        if (projectIdStr && !isUuid(projectIdStr)) {
            return NextResponse.json({ error: 'projectId must be a UUID' }, { status: 400 });
        }
        const updateData = { updatedAt: new Date() };
        if (body.title !== undefined)
            updateData.title = String(body.title || '').trim();
        if (body.typeId !== undefined)
            updateData.typeId = body.typeId ? String(body.typeId) : null;
        if (body.budgetAmount !== undefined) {
            const budgetNum = Number(body.budgetAmount ?? 0);
            if (!Number.isFinite(budgetNum) || budgetNum < 0) {
                return NextResponse.json({ error: 'budgetAmount must be a valid non-negative number' }, { status: 400 });
            }
            updateData.budgetAmount = String(budgetNum);
        }
        if (body.startDate !== undefined)
            updateData.startDate = body.startDate ? new Date(body.startDate) : null;
        if (body.endDate !== undefined)
            updateData.endDate = body.endDate ? new Date(body.endDate) : null;
        if (body.allocateByType !== undefined)
            updateData.allocateByType = Boolean(body.allocateByType);
        if (body.isArchived !== undefined)
            updateData.isArchived = Boolean(body.isArchived);
        await db.update(marketingPlans).set(updateData).where(eq(marketingPlans.id, id));
        // Apply project link change after plan update.
        if (linkingEnabled && body.projectId !== undefined) {
            await setLinkedProjectId(db, 'plan', id, projectIdStr || null);
        }
        const [updated] = await db.select().from(marketingPlans).where(eq(marketingPlans.id, id)).limit(1);
        const projectId = linkingEnabled ? await getLinkedProjectId(db, 'plan', id) : null;
        return NextResponse.json({ ...updated, projectId });
    }
    catch (error) {
        console.error('Error updating plan:', error);
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }
}
export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const hard = searchParams.get('hard') === 'true';
        const user = extractUserFromRequest(request);
        // Check delete permission and resolve scope mode
        const mode = await resolveMarketingScopeMode(request, { entity: 'plans', verb: 'delete' });
        if (mode === 'none') {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }
        const [existing] = await db
            .select({ id: marketingPlans.id })
            .from(marketingPlans)
            .where(eq(marketingPlans.id, id))
            .limit(1);
        if (!existing)
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        // Scope mode check: 'own' mode denies access since plans have no ownership field
        if (mode === 'own') {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }
        // 'any' and 'ldd' modes allow access
        if (hard) {
            await db.delete(marketingPlans).where(eq(marketingPlans.id, id));
            // Clean up links (no FK cascade)
            await db
                .delete(marketingEntityLinks)
                .where(and(eq(marketingEntityLinks.marketingEntityType, 'plan'), eq(marketingEntityLinks.marketingEntityId, id)));
            return NextResponse.json({ success: true, deleted: true });
        }
        await db.update(marketingPlans).set({ isArchived: true, updatedAt: new Date() }).where(eq(marketingPlans.id, id));
        return NextResponse.json({ success: true, archived: true });
    }
    catch (error) {
        console.error('Error deleting plan:', error);
        return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
    }
}
