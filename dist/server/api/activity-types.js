/**
 * Marketing Activity Types API
 *
 * GET  - List activity types
 * POST - Create activity type (admin)
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingActivityTypes } from '@/lib/feature-pack-schemas';
import { asc, eq } from 'drizzle-orm';
import { extractUserFromRequest, isAdmin } from '../auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('activeOnly') !== 'false';
        const category = searchParams.get('category');
        let query = db
            .select()
            .from(marketingActivityTypes)
            .orderBy(asc(marketingActivityTypes.sortOrder), asc(marketingActivityTypes.name));
        if (activeOnly)
            query = query.where(eq(marketingActivityTypes.isActive, true));
        const items = await query;
        const filtered = category ? items.filter((it) => it.category === category) : items;
        return NextResponse.json({ items: filtered });
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
