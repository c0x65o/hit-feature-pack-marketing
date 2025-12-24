/**
 * Marketing Vendors API
 *
 * GET  - List vendors
 * POST - Create vendor
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingVendors } from '@/lib/feature-pack-schemas';
import { and, asc, eq, like, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const kind = searchParams.get('kind');
    const search = searchParams.get('search');

    const conditions: any[] = [];
    if (activeOnly) conditions.push(eq(marketingVendors.isActive, true));
    if (kind) conditions.push(eq(marketingVendors.kind, kind));
    if (search) {
      conditions.push(or(like(marketingVendors.name, `%${search}%`), like(marketingVendors.contact, `%${search}%`))!);
    }

    let query = db.select().from(marketingVendors).orderBy(asc(marketingVendors.name));
    if (conditions.length > 0) query = query.where(and(...conditions)) as typeof query;

    const items = await query;
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, kind, link, contact, notes, isActive = true } = body || {};

    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!kind?.trim()) return NextResponse.json({ error: 'kind is required' }, { status: 400 });

    const validKinds = ['Platform', 'Agency', 'Creator', 'Other'];
    if (!validKinds.includes(String(kind))) {
      return NextResponse.json({ error: `kind must be one of: ${validKinds.join(', ')}` }, { status: 400 });
    }

    const now = new Date();
    const [created] = await db
      .insert(marketingVendors)
      .values({
        name: String(name).trim(),
        kind: String(kind),
        link: link || null,
        contact: contact || null,
        notes: notes || null,
        isActive: Boolean(isActive),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}


