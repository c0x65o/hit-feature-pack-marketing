/**
 * Single Plan Type API
 *
 * GET    - Get a plan type
 * PUT    - Update a plan type (admin)
 * DELETE - Delete a plan type (admin, not system)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingPlanTypes } from '@/lib/feature-pack-schemas';
import { eq } from 'drizzle-orm';
import { extractUserFromRequest, isAdmin } from '../auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    const [item] = await db.select().from(marketingPlanTypes).where(eq(marketingPlanTypes.id, id)).limit(1);
    if (!item) return NextResponse.json({ error: 'Plan type not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching plan type:', error);
    return NextResponse.json({ error: 'Failed to fetch plan type' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = extractUserFromRequest(request);
    if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select({ id: marketingPlanTypes.id, isSystem: marketingPlanTypes.isSystem }).from(marketingPlanTypes).where(eq(marketingPlanTypes.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: 'Plan type not found' }, { status: 404 });

    const updates: any = { updatedAt: new Date() };
    if (body.key !== undefined) updates.key = body.key;
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.color !== undefined) updates.color = body.color;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.sortOrder !== undefined) updates.sortOrder = String(body.sortOrder);
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    await db.update(marketingPlanTypes).set(updates).where(eq(marketingPlanTypes.id, id));
    const [updated] = await db.select().from(marketingPlanTypes).where(eq(marketingPlanTypes.id, id)).limit(1);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating plan type:', error);
    return NextResponse.json({ error: 'Failed to update plan type' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = extractUserFromRequest(request);
    if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const db = getDb();
    const { id } = await params;
    const [existing] = await db.select({ id: marketingPlanTypes.id, isSystem: marketingPlanTypes.isSystem }).from(marketingPlanTypes).where(eq(marketingPlanTypes.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: 'Plan type not found' }, { status: 404 });
    if (existing.isSystem) return NextResponse.json({ error: 'Cannot delete system plan types' }, { status: 403 });

    await db.delete(marketingPlanTypes).where(eq(marketingPlanTypes.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan type:', error);
    return NextResponse.json({ error: 'Failed to delete plan type' }, { status: 500 });
  }
}


