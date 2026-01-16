/**
 * Marketing Activity Types API
 *
 * GET  - List activity types
 * POST - Create activity type (admin)
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { DEFAULT_MARKETING_ACTIVITY_TYPES, marketingActivityTypes } from '@/lib/feature-pack-schemas';
import { and, asc, eq, like, or, sql } from 'drizzle-orm';
import { extractUserFromRequest, isAdmin } from '../auth';
import { randomUUID } from 'crypto';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
async function ensureSeeded(db) {
    const [{ count }] = (await db
        .select({ count: sql `count(*)` })
        .from(marketingActivityTypes)
        .limit(1)) || [];
    if (Number(count || 0) > 0)
        return;
    const now = new Date();
    const rows = DEFAULT_MARKETING_ACTIVITY_TYPES.map((t) => ({
        id: randomUUID(),
        key: t.key,
        name: t.name,
        category: t.category ?? null,
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
        await db.insert(marketingActivityTypes).values(rows);
    }
    catch (error) {
        // Best-effort: avoid failing the request on concurrent seed races.
        if (error?.code === '23505' || error?.message?.includes('unique'))
            return;
        throw error;
    }
}
export async function GET(request) {
    try {
        const db = getDb();
        await ensureSeeded(db);
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('activeOnly') !== 'false';
        const category = searchParams.get('category');
        const search = (searchParams.get('search') || '').trim();
        const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);
        const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
        const conditions = [];
        if (activeOnly)
            conditions.push(eq(marketingActivityTypes.isActive, true));
        if (category)
            conditions.push(eq(marketingActivityTypes.category, category));
        if (search) {
            conditions.push(or(like(marketingActivityTypes.name, `%${search}%`), like(marketingActivityTypes.key, `%${search}%`)));
        }
        let query = db
            .select()
            .from(marketingActivityTypes)
            .orderBy(asc(marketingActivityTypes.sortOrder), asc(marketingActivityTypes.name));
        if (conditions.length > 0)
            query = query.where(and(...conditions));
        const countQuery = db.select({ count: sql `count(*)` }).from(marketingActivityTypes);
        const [countRow] = conditions.length > 0 ? await countQuery.where(and(...conditions)) : await countQuery;
        const total = Number(countRow?.count || 0);
        const items = await query.limit(limit).offset(offset);
        return NextResponse.json({ items, total, limit, offset });
    }
    catch (error) {
        console.error('Error fetching activity types:', error);
        return NextResponse.json({ error: 'Failed to fetch activity types' }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        const user = extractUserFromRequest(request);
        if (!isAdmin(user))
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        const db = getDb();
        const body = await request.json();
        const { key, name, category, description, color, icon } = body || {};
        // Prevent clients from creating "system" types via API.
        if (body?.isSystem !== undefined) {
            return NextResponse.json({ error: 'isSystem cannot be set via API' }, { status: 400 });
        }
        if (!key?.trim())
            return NextResponse.json({ error: 'key is required' }, { status: 400 });
        if (!name?.trim())
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        const [existing] = await db.select({ id: marketingActivityTypes.id }).from(marketingActivityTypes).where(eq(marketingActivityTypes.key, String(key))).limit(1);
        if (existing)
            return NextResponse.json({ error: 'An activity type with this key already exists' }, { status: 409 });
        const now = new Date();
        const allTypes = await db.select().from(marketingActivityTypes);
        const maxSort = allTypes.length;
        const [created] = await db
            .insert(marketingActivityTypes)
            .values({
            id: randomUUID(),
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
    }
    catch (error) {
        console.error('Error creating activity type:', error);
        return NextResponse.json({ error: 'Failed to create activity type' }, { status: 500 });
    }
}
