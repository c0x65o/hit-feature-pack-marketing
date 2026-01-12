/**
 * Marketing Vendors API
 *
 * GET  - List vendors
 * POST - Create vendor
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingVendors } from '@/lib/feature-pack-schemas';
import { and, asc, eq, like, or, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { resolveMarketingScopeMode } from '../lib/scope-mode';
import { requireMarketingAction } from '../lib/require-action';
import { extractUserFromRequest } from '../auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const user = extractUserFromRequest(request);
        // Check read permission and resolve scope mode
        const mode = await resolveMarketingScopeMode(request, { entity: 'vendors', verb: 'read' });
        if (mode === 'none') {
            // Explicit deny: return empty results
            return NextResponse.json({ items: [], total: 0, limit: 0, offset: 0 });
        }
        const activeOnly = searchParams.get('activeOnly') !== 'false';
        const kind = searchParams.get('kind');
        const search = searchParams.get('search');
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
        const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
        const conditions = [];
        if (activeOnly)
            conditions.push(eq(marketingVendors.isActive, true));
        if (kind)
            conditions.push(eq(marketingVendors.kind, kind));
        if (search) {
            conditions.push(or(like(marketingVendors.name, `%${search}%`), like(marketingVendors.contact, `%${search}%`)));
        }
        // Scope mode filtering
        // Note: Vendors don't have createdBy/ownerUserId, so 'own' mode returns empty results
        if (mode === 'own') {
            // No ownership field, so deny access
            return NextResponse.json({ items: [], total: 0, limit: 0, offset: 0 });
        }
        // 'any' and 'ldd' modes allow all (no filtering needed)
        let query = db.select().from(marketingVendors).orderBy(asc(marketingVendors.name));
        if (conditions.length > 0)
            query = query.where(and(...conditions));
        // Total count (for pagination UI)
        const countQuery = db.select({ count: sql `count(*)` }).from(marketingVendors);
        const [countResult] = conditions.length > 0 ? await countQuery.where(and(...conditions)) : await countQuery;
        const total = Number(countResult?.count || 0);
        const items = await query.limit(limit).offset(offset);
        return NextResponse.json({ items, total, limit, offset });
    }
    catch (error) {
        console.error('Error fetching vendors:', error);
        return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        // Check create permission
        const createCheck = await requireMarketingAction(request, 'marketing.vendors.create');
        if (createCheck)
            return createCheck;
        // Check write permission
        const mode = await resolveMarketingScopeMode(request, { entity: 'vendors', verb: 'write' });
        // Vendors currently have no ownership field; treat 'own' as a hard deny to avoid
        // creating records that the user can never read/update in 'own' mode.
        if (mode === 'none' || mode === 'own') {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }
        const db = getDb();
        const body = await request.json();
        const { name, kind, link, contact, notes, isActive = true } = body || {};
        if (!name?.trim())
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        if (!kind?.trim())
            return NextResponse.json({ error: 'kind is required' }, { status: 400 });
        const validKinds = ['Platform', 'Agency', 'Creator', 'Other'];
        if (!validKinds.includes(String(kind))) {
            return NextResponse.json({ error: `kind must be one of: ${validKinds.join(', ')}` }, { status: 400 });
        }
        const now = new Date();
        const [created] = await db
            .insert(marketingVendors)
            .values({
            id: randomUUID(),
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
    }
    catch (error) {
        console.error('Error creating vendor:', error);
        return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
    }
}
