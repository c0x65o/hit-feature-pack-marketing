/**
 * Marketing Links API (optional)
 *
 * This endpoint is gated behind the pack option `enable_project_linking`.
 * Marketing stays standalone; links are never required.
 *
 * GET    /api/marketing/links?marketingEntityType=plan&marketingEntityId=...   -> list links for an entity
 * POST   /api/marketing/links  { marketingEntityType, marketingEntityId, linkedEntityKind, linkedEntityId }
 * DELETE /api/marketing/links?id=... OR same body fields
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingEntityLinks } from '@/lib/feature-pack-schemas';
import { and, eq } from 'drizzle-orm';
import { extractUserFromRequest, getMarketingOptionsFromRequest } from '../auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function linkingDisabled() {
  return NextResponse.json(
    { error: 'Project linking is disabled for marketing. Enable option enable_project_linking to use links.' },
    { status: 403 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const opts = getMarketingOptionsFromRequest(request);
    if (!opts.enable_project_linking) return linkingDisabled();

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const marketingEntityType = (searchParams.get('marketingEntityType') || '').trim();
    const marketingEntityId = (searchParams.get('marketingEntityId') || '').trim();
    const linkedEntityKind = (searchParams.get('linkedEntityKind') || '').trim();
    const linkedEntityId = (searchParams.get('linkedEntityId') || '').trim();

    const conditions: any[] = [];
    if (marketingEntityType) conditions.push(eq(marketingEntityLinks.marketingEntityType, marketingEntityType));
    if (marketingEntityId) conditions.push(eq(marketingEntityLinks.marketingEntityId, marketingEntityId));
    if (linkedEntityKind) conditions.push(eq(marketingEntityLinks.linkedEntityKind, linkedEntityKind));
    if (linkedEntityId) conditions.push(eq(marketingEntityLinks.linkedEntityId, linkedEntityId));

    let q = db.select().from(marketingEntityLinks);
    if (conditions.length > 0) q = q.where(and(...conditions)) as typeof q;

    const items = await q;
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching marketing links:', error);
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const opts = getMarketingOptionsFromRequest(request);
    if (!opts.enable_project_linking) return linkingDisabled();

    const user = extractUserFromRequest(request);
    if (!user?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const body = await request.json();
    const marketingEntityType = String(body?.marketingEntityType || '').trim();
    const marketingEntityId = String(body?.marketingEntityId || '').trim();
    const linkedEntityKind = String(body?.linkedEntityKind || '').trim();
    const linkedEntityId = String(body?.linkedEntityId || '').trim();

    if (!marketingEntityType) return NextResponse.json({ error: 'marketingEntityType is required' }, { status: 400 });
    if (!marketingEntityId) return NextResponse.json({ error: 'marketingEntityId is required' }, { status: 400 });
    if (!linkedEntityKind) return NextResponse.json({ error: 'linkedEntityKind is required' }, { status: 400 });
    if (!linkedEntityId) return NextResponse.json({ error: 'linkedEntityId is required' }, { status: 400 });

    const now = new Date();
    const [created] = await db
      .insert(marketingEntityLinks)
      .values({
        marketingEntityType,
        marketingEntityId,
        linkedEntityKind,
        linkedEntityId,
        createdByUserId: user.sub,
        createdAt: now,
      })
      .onConflictDoNothing()
      .returning();

    return NextResponse.json(created || { success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating marketing link:', error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const opts = getMarketingOptionsFromRequest(request);
    if (!opts.enable_project_linking) return linkingDisabled();

    const user = extractUserFromRequest(request);
    if (!user?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get('id') || '').trim();

    if (id) {
      await db.delete(marketingEntityLinks).where(eq(marketingEntityLinks.id, id as any));
      return NextResponse.json({ success: true });
    }

    const body = await request.json().catch(() => ({}));
    const marketingEntityType = String(body?.marketingEntityType || '').trim();
    const marketingEntityId = String(body?.marketingEntityId || '').trim();
    const linkedEntityKind = String(body?.linkedEntityKind || '').trim();
    const linkedEntityId = String(body?.linkedEntityId || '').trim();

    if (!marketingEntityType || !marketingEntityId || !linkedEntityKind || !linkedEntityId) {
      return NextResponse.json({ error: 'Provide id or full link identity to delete' }, { status: 400 });
    }

    await db
      .delete(marketingEntityLinks)
      .where(
        and(
          eq(marketingEntityLinks.marketingEntityType, marketingEntityType),
          eq(marketingEntityLinks.marketingEntityId, marketingEntityId),
          eq(marketingEntityLinks.linkedEntityKind, linkedEntityKind),
          eq(marketingEntityLinks.linkedEntityId, linkedEntityId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting marketing link:', error);
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}


