/**
 * Single Activity Type API
 *
 * GET    - Get an activity type
 * PUT    - Update an activity type (admin)
 * DELETE - Delete an activity type (admin, not system)
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingActivityTypes } from '@/lib/feature-pack-schemas';
import { eq } from 'drizzle-orm';
import { extractUserFromRequest, isAdmin } from '../auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(_request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const [item] = await db.select().from(marketingActivityTypes).where(eq(marketingActivityTypes.id, id)).limit(1);
        if (!item)
            return NextResponse.json({ error: 'Activity type not found' }, { status: 404 });
        return NextResponse.json(item);
    }
    catch (error) {
        console.error('Error fetching activity type:', error);
        return NextResponse.json({ error: 'Failed to fetch activity type' }, { status: 500 });
    }
}
export async function PUT(request, { params }) {
    try {
        const user = extractUserFromRequest(request);
        if (!isAdmin(user))
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const [existing] = await db.select({ id: marketingActivityTypes.id, isSystem: marketingActivityTypes.isSystem }).from(marketingActivityTypes).where(eq(marketingActivityTypes.id, id)).limit(1);
        if (!existing)
            return NextResponse.json({ error: 'Activity type not found' }, { status: 404 });
        const updates = { updatedAt: new Date() };
        if (body.key !== undefined)
            updates.key = body.key;
        if (body.name !== undefined)
            updates.name = body.name;
        if (body.category !== undefined)
            updates.category = body.category;
        if (body.description !== undefined)
            updates.description = body.description;
        if (body.color !== undefined)
            updates.color = body.color;
        if (body.icon !== undefined)
            updates.icon = body.icon;
        if (body.sortOrder !== undefined)
            updates.sortOrder = String(body.sortOrder);
        if (body.isActive !== undefined)
            updates.isActive = body.isActive;
        await db.update(marketingActivityTypes).set(updates).where(eq(marketingActivityTypes.id, id));
        const [updated] = await db.select().from(marketingActivityTypes).where(eq(marketingActivityTypes.id, id)).limit(1);
        return NextResponse.json(updated);
    }
    catch (error) {
        console.error('Error updating activity type:', error);
        return NextResponse.json({ error: 'Failed to update activity type' }, { status: 500 });
    }
}
export async function DELETE(request, { params }) {
    try {
        const user = extractUserFromRequest(request);
        if (!isAdmin(user))
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        const db = getDb();
        const { id } = await params;
        const [existing] = await db.select({ id: marketingActivityTypes.id, isSystem: marketingActivityTypes.isSystem }).from(marketingActivityTypes).where(eq(marketingActivityTypes.id, id)).limit(1);
        if (!existing)
            return NextResponse.json({ error: 'Activity type not found' }, { status: 404 });
        if (existing.isSystem)
            return NextResponse.json({ error: 'Cannot delete system activity types' }, { status: 403 });
        await db.delete(marketingActivityTypes).where(eq(marketingActivityTypes.id, id));
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting activity type:', error);
        return NextResponse.json({ error: 'Failed to delete activity type' }, { status: 500 });
    }
}
