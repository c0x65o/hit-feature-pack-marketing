/**
 * Marketing Plan Types API
 *
 * GET  - List plan types
 * POST - Create plan type (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { DEFAULT_MARKETING_PLAN_TYPES, marketingPlanTypes } from '@/lib/feature-pack-schemas';
import { and, asc, eq, like, or, sql } from 'drizzle-orm';
import { extractUserFromRequest, isAdmin } from '../auth';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function ensureSeeded(db: any) {
  const [{ count }] =
    (await db
      .select({ count: sql<number>`count(*)` })
      .from(marketingPlanTypes)
      .limit(1)) || [];

  if (Number(count || 0) > 0) return;

  const now = new Date();
  const rows = (DEFAULT_MARKETING_PLAN_TYPES as any[]).map((t) => ({
    id: randomUUID(),
    key: t.key,
    name: t.name,
    description: t.description ?? null,
    color: t.color ?? null,
    icon: t.icon ?? null,
    sortOrder: t.sortOrder ?? '0',
    isSystem: true,
    isActive: t.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }));

  try {
    await db.insert(marketingPlanTypes).values(rows);
  } catch (error: any) {
    // Best-effort: avoid failing the request on concurrent seed races.
    if (error?.code === '23505' || error?.message?.includes('unique')) return;
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    await ensureSeeded(db);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const search = (searchParams.get('search') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const conditions: any[] = [];
    if (activeOnly) conditions.push(eq(marketingPlanTypes.isActive, true));
    if (search) {
      conditions.push(or(like(marketingPlanTypes.name, `%${search}%`), like(marketingPlanTypes.key, `%${search}%`))!);
    }

    let query = db
      .select()
      .from(marketingPlanTypes)
      .orderBy(asc(marketingPlanTypes.sortOrder), asc(marketingPlanTypes.name));
    if (conditions.length > 0) query = query.where(and(...conditions)) as typeof query;

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(marketingPlanTypes);
    const [countRow] = conditions.length > 0 ? await countQuery.where(and(...conditions)) : await countQuery;
    const total = Number(countRow?.count || 0);

    const items = await (query as any).limit(limit).offset(offset);
    return NextResponse.json({ items, total, limit, offset });
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

    // Prevent clients from creating "system" types via API.
    if (body?.isSystem !== undefined) {
      return NextResponse.json({ error: 'isSystem cannot be set via API' }, { status: 400 });
    }

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
        id: randomUUID(),
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


