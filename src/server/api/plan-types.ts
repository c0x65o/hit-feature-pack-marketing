/**
 * Marketing Plan Types API
 *
 * GET  - List plan types
 * POST - Create plan type (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingPlanTypes } from '@/lib/feature-pack-schemas';
import { asc, eq } from 'drizzle-orm';
import { extractUserFromRequest, isAdmin } from '../auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    let query = db
      .select()
      .from(marketingPlanTypes)
      .orderBy(asc(marketingPlanTypes.sortOrder), asc(marketingPlanTypes.name));
    if (activeOnly) query = query.where(eq(marketingPlanTypes.isActive, true)) as typeof query;

    const items = await query;
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching plan types:', error);
    return NextResponse.json({ error: 'Failed to fetch plan types' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = extractUserFromRequest(request);
    if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const db = getDb();
    const body = await request.json();
    const { key, name, description, color, icon } = body || {};

    if (!key?.trim()) return NextResponse.json({ error: 'key is required' }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const [existing] = await db.select({ id: marketingPlanTypes.id }).from(marketingPlanTypes).where(eq(marketingPlanTypes.key, String(key))).limit(1);
    if (existing) return NextResponse.json({ error: 'A plan type with this key already exists' }, { status: 409 });

    const now = new Date();
    const allTypes = await db.select().from(marketingPlanTypes);
    const maxSort = allTypes.length;

    const [created] = await db
      .insert(marketingPlanTypes)
      .values({
        key: String(key).trim(),
        name: String(name).trim(),
        description: description || null,
        color: color || null,
        icon: icon || null,
        sortOrder: String(maxSort),
        isSystem: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating plan type:', error);
    return NextResponse.json({ error: 'Failed to create plan type' }, { status: 500 });
  }
}


