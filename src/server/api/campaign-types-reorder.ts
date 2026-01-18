/**
 * Marketing Campaign Types Reorder API
 *
 * PUT - Reorder campaign types
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingCampaignTypes } from '@/lib/feature-pack-schemas';
import { asc, eq } from 'drizzle-orm';
import { extractUserFromRequest } from '../auth';
import { requireMarketingAction } from '../lib/require-action';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireMarketingAction(request, 'marketing.setup.campaign-types.access');
    if (authCheck) return authCheck;

    const user = extractUserFromRequest(request);
    if (!user?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const body = await request.json();

    if (!Array.isArray(body?.types) || body.types.length === 0) {
      return NextResponse.json(
        { error: 'types array is required with at least one { id, order } object' },
        { status: 400 }
      );
    }

    for (const t of body.types) {
      if (!t?.id || t?.order === undefined || t?.order === null) {
        return NextResponse.json({ error: 'Each type must have id and order fields' }, { status: 400 });
      }
      const orderValue = Number.parseInt(String(t.order), 10);
      if (!Number.isFinite(orderValue)) {
        return NextResponse.json({ error: 'Each type order must be a number' }, { status: 400 });
      }
    }

    const updated = [];
    const now = new Date();
    for (const t of body.types) {
      const orderValue = Number.parseInt(String(t.order), 10);
      const [row] = await db
        .update(marketingCampaignTypes)
        .set({
          order: orderValue,
          lastUpdatedByUserId: user.sub,
          lastUpdatedOnTimestamp: now,
        })
        .where(eq(marketingCampaignTypes.id, String(t.id)))
        .returning();
      if (row) updated.push(row);
    }

    const items = await db.select().from(marketingCampaignTypes).orderBy(asc(marketingCampaignTypes.order));
    return NextResponse.json({ success: true, updated: updated.length, items });
  } catch (error: any) {
    console.error('[marketing/campaign-types/reorder] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to reorder campaign types' }, { status: 500 });
  }
}
