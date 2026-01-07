/**
 * Marketing Activity Types API
 *
 * GET  - List activity types
 * POST - Create activity type (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingActivityTypes } from '@/lib/feature-pack-schemas';
import { and, asc, eq, like, or, sql } from 'drizzle-orm';
import { extractUserFromRequest, isAdmin } from '../auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const category = searchParams.get('category');
    const search = (searchParams.get('search') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const conditions: any[] = [];
    if (activeOnly) conditions.push(eq(marketingActivityTypes.isActive, true));
    if (category) conditions.push(eq(marketingActivityTypes.category, category));
    if (search) {
      conditions.push(or(like(marketingActivityTypes.name, `%${search}%`), like(marketingActivityTypes.key, `%${search}%`))!);
    }

    let query = db
      .select()
      .from(marketingActivityTypes)
      .orderBy(asc(marketingActivityTypes.sortOrder), asc(marketingActivityTypes.name));
    if (conditions.length > 0) query = query.where(and(...conditions)) as typeof query;

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(marketingActivityTypes);
    const [countRow] = conditions.length > 0 ? await countQuery.where(and(...conditions)) : await countQuery;
    const total = Number(countRow?.count || 0);

    const items = await (query as any).limit(limit).offset(offset);
    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    console.error('Error fetching activity types:', error);
    return NextResponse.json({ error: 'Failed to fetch activity types' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = extractUserFromRequest(request);
    if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const db = getDb();
    const body = await request.json();
    const { key, name, category, description, color, icon } = body || {};

    if (!key?.trim()) return NextResponse.json({ error: 'key is required' }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const [existing] = await db.select({ id: marketingActivityTypes.id }).from(marketingActivityTypes).where(eq(marketingActivityTypes.key, String(key))).limit(1);
    if (existing) return NextResponse.json({ error: 'An activity type with this key already exists' }, { status: 409 });

    const now = new Date();
    const allTypes = await db.select().from(marketingActivityTypes);
    const maxSort = allTypes.length;

    const [created] = await db
      .insert(marketingActivityTypes)
      .values({
        key: String(key).trim(),
        name: String(name).trim(),
        category: category || null,
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
    console.error('Error creating activity type:', error);
    return NextResponse.json({ error: 'Failed to create activity type' }, { status: 500 });
  }
}


