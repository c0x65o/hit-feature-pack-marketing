/**
 * Marketing Expense Detail API
 *
 * GET    - Get expense by id (with joined plan/vendor/type)
 * PUT    - Update expense
 * DELETE - Delete expense
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingExpenses, marketingPlans, marketingActivityTypes, marketingVendors, marketingEntityLinks, } from '@/lib/feature-pack-schemas';
import { and, eq } from 'drizzle-orm';
import { getProjectLinkingPolicy, getLinkedProjectId, isUuid, setLinkedProjectId } from '../lib/project-linking';
import { resolveMarketingScopeMode } from '../lib/scope-mode';
import { extractUserFromRequest } from '../auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const user = extractUserFromRequest(request);
        // Check read permission and resolve scope mode
        const mode = await resolveMarketingScopeMode(request, { entity: 'expenses', verb: 'read' });
        if (mode === 'none') {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }
        const [row] = await db
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
            .where(eq(marketingExpenses.id, id))
            .limit(1);
        if (!row)
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        // Scope mode check: 'own' mode requires ownership
        if (mode === 'own') {
            const ownerKey = user?.sub || '';
            if (!ownerKey || row.expense.createdBy !== ownerKey) {
                return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
            }
        }
        // 'any' and 'ldd' modes allow access
        const { enabled: linkingEnabled } = getProjectLinkingPolicy(request);
        const projectId = linkingEnabled ? await getLinkedProjectId(db, 'expense', id) : null;
        return NextResponse.json({
            ...row.expense,
            amount: Number(row.expense.amount || 0),
            plan: row.plan || null,
            type: row.type || null,
            vendor: row.vendor || null,
            projectId,
        });
    }
    catch (error) {
        console.error('Error fetching expense:', error);
        return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
    }
}
export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const user = extractUserFromRequest(request);
        // Check write permission and resolve scope mode
        const mode = await resolveMarketingScopeMode(request, { entity: 'expenses', verb: 'write' });
        if (mode === 'none') {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }
        const [existing] = await db
            .select({ id: marketingExpenses.id, createdBy: marketingExpenses.createdBy })
            .from(marketingExpenses)
            .where(eq(marketingExpenses.id, id))
            .limit(1);
        if (!existing)
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        // Scope mode check: 'own' mode requires ownership
        if (mode === 'own') {
            const ownerKey = user?.sub || '';
            if (!ownerKey || existing.createdBy !== ownerKey) {
                return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
            }
        }
        // 'any' and 'ldd' modes allow access
        const { enabled: linkingEnabled, required: linkingRequired } = getProjectLinkingPolicy(request);
        const projectIdStr = body.projectId !== undefined && body.projectId !== null ? String(body.projectId).trim() : '';
        if (linkingEnabled && linkingRequired && body.projectId !== undefined && !projectIdStr) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }
        if (projectIdStr && !isUuid(projectIdStr)) {
            return NextResponse.json({ error: 'projectId must be a UUID' }, { status: 400 });
        }
        if (body.planId) {
            const [plan] = await db.select({ id: marketingPlans.id }).from(marketingPlans).where(eq(marketingPlans.id, body.planId)).limit(1);
            if (!plan)
                return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }
        if (body.typeId) {
            const [type] = await db
                .select({ id: marketingActivityTypes.id })
                .from(marketingActivityTypes)
                .where(eq(marketingActivityTypes.id, String(body.typeId)))
                .limit(1);
            if (!type)
                return NextResponse.json({ error: 'Activity type not found' }, { status: 404 });
        }
        if (body.vendorId) {
            const [vendor] = await db.select({ id: marketingVendors.id }).from(marketingVendors).where(eq(marketingVendors.id, body.vendorId)).limit(1);
            if (!vendor)
                return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }
        if (body.amount !== undefined) {
            const amountNum = Number(body.amount);
            if (!Number.isFinite(amountNum) || amountNum <= 0) {
                return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
            }
        }
        const updateData = { updatedAt: new Date() };
        if (body.planId !== undefined)
            updateData.planId = body.planId || null;
        if (body.typeId !== undefined)
            updateData.typeId = body.typeId ? String(body.typeId) : null;
        if (body.vendorId !== undefined)
            updateData.vendorId = body.vendorId || null;
        if (body.occurredAt !== undefined)
            updateData.occurredAt = new Date(body.occurredAt);
        if (body.amount !== undefined)
            updateData.amount = String(Number(body.amount));
        if (body.notes !== undefined)
            updateData.notes = body.notes || null;
        if (body.attachmentUrl !== undefined)
            updateData.attachmentUrl = body.attachmentUrl || null;
        await db.update(marketingExpenses).set(updateData).where(eq(marketingExpenses.id, id));
        if (linkingEnabled && body.projectId !== undefined) {
            await setLinkedProjectId(db, 'expense', id, projectIdStr || null);
        }
        // Return enriched row
        const [row] = await db
            .select({
            expense: marketingExpenses,
            plan: { id: marketingPlans.id, title: marketingPlans.title },
            type: { id: marketingActivityTypes.id, name: marketingActivityTypes.name, color: marketingActivityTypes.color },
            vendor: { id: marketingVendors.id, name: marketingVendors.name, kind: marketingVendors.kind },
        })
            .from(marketingExpenses)
            .leftJoin(marketingPlans, eq(marketingExpenses.planId, marketingPlans.id))
            .leftJoin(marketingActivityTypes, eq(marketingExpenses.typeId, marketingActivityTypes.id))
            .leftJoin(marketingVendors, eq(marketingExpenses.vendorId, marketingVendors.id))
            .where(eq(marketingExpenses.id, id))
            .limit(1);
        const projectId = linkingEnabled ? await getLinkedProjectId(db, 'expense', id) : null;
        return NextResponse.json({
            ...row.expense,
            amount: Number(row.expense.amount || 0),
            plan: row.plan || null,
            type: row.type || null,
            vendor: row.vendor || null,
            projectId,
        });
    }
    catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }
}
export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const user = extractUserFromRequest(request);
        // Check delete permission and resolve scope mode
        const mode = await resolveMarketingScopeMode(request, { entity: 'expenses', verb: 'delete' });
        if (mode === 'none') {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }
        const [existing] = await db
            .select({ id: marketingExpenses.id, createdBy: marketingExpenses.createdBy })
            .from(marketingExpenses)
            .where(eq(marketingExpenses.id, id))
            .limit(1);
        if (!existing)
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        // Scope mode check: 'own' mode requires ownership
        if (mode === 'own') {
            const ownerKey = user?.sub || '';
            if (!ownerKey || existing.createdBy !== ownerKey) {
                return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
            }
        }
        // 'any' and 'ldd' modes allow access
        await db.delete(marketingExpenses).where(eq(marketingExpenses.id, id));
        // Clean up links (no FK cascade)
        await db
            .delete(marketingEntityLinks)
            .where(and(eq(marketingEntityLinks.marketingEntityType, 'expense'), eq(marketingEntityLinks.marketingEntityId, id)));
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}
