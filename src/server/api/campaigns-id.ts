/**
 * Marketing Campaign Detail API
 *
 * GET    - Get campaign by id
 * PUT    - Update campaign
 * DELETE - Delete campaign
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingCampaigns, marketingCampaignTypes } from '@/lib/feature-pack-schemas';
import { eq } from 'drizzle-orm';
import { extractUserFromRequest } from '../auth';
import { resolveMarketingScopeMode } from '../lib/scope-mode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteParams = { params: Promise<{ id: string }> };

const CAMPAIGN_STATUSES = ['planned', 'active', 'paused', 'completed', 'cancelled'] as const;
type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
const campaignStatusSet = new Set<string>(CAMPAIGN_STATUSES);

function parseCampaignStatus(value: unknown): CampaignStatus | null {
  if (value === undefined || value === null || value === '') return null;
  const status = String(value);
  return campaignStatusSet.has(status) ? (status as CampaignStatus) : null;
}

function parseDateValue(value: unknown): Date | null | 'invalid' {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'invalid';
  return date;
}

function normalizeScopeValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value.find((entry) => entry !== undefined && entry !== null && String(entry).trim() !== '');
    return first ? String(first) : null;
  }
  if (value === undefined || value === null || value === '') return null;
  return String(value);
}

function isOwnedByUser(campaign: any, userId: string): boolean {
  if (!userId) return false;
  return campaign?.ownerUserId === userId || campaign?.createdByUserId === userId;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    const user = extractUserFromRequest(request);

    const mode = await resolveMarketingScopeMode(request, { entity: 'campaigns', verb: 'read' });
    if (mode === 'none') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const [row] = await db
      .select({
        campaign: marketingCampaigns,
        type: {
          id: marketingCampaignTypes.id,
          name: marketingCampaignTypes.name,
          code: marketingCampaignTypes.code,
          color: marketingCampaignTypes.color,
        },
      })
      .from(marketingCampaigns)
      .leftJoin(marketingCampaignTypes, eq(marketingCampaigns.campaignTypeId, marketingCampaignTypes.id))
      .where(eq(marketingCampaigns.id, id as any))
      .limit(1);

    if (!row) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    if (mode === 'own' && !isOwnedByUser(row.campaign, user?.sub || '')) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    // 'any' and 'ldd' modes allow access

    return NextResponse.json({
      ...row.campaign,
      budgetAmount: Number(row.campaign.budgetAmount || 0),
      campaignType: row.type || null,
      campaignTypeName: row.type?.name ?? null,
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const user = extractUserFromRequest(request);

    const mode = await resolveMarketingScopeMode(request, { entity: 'campaigns', verb: 'write' });
    if (mode === 'none') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const [existing] = await db
      .select({
        id: marketingCampaigns.id,
        ownerUserId: marketingCampaigns.ownerUserId,
        createdByUserId: marketingCampaigns.createdByUserId,
      })
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, id as any))
      .limit(1);

    if (!existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    if (mode === 'own' && !isOwnedByUser(existing, user?.sub || '')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    // 'any' and 'ldd' modes allow access

    const parsedStatus = parseCampaignStatus(body?.status);
    if (body?.status !== undefined && parsedStatus === null) {
      return NextResponse.json(
        { error: `status must be one of: ${CAMPAIGN_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const startDateValue = parseDateValue(body?.startDate);
    if (startDateValue === 'invalid') {
      return NextResponse.json({ error: 'startDate must be a valid date' }, { status: 400 });
    }
    const endDateValue = parseDateValue(body?.endDate);
    if (endDateValue === 'invalid') {
      return NextResponse.json({ error: 'endDate must be a valid date' }, { status: 400 });
    }

    if (body?.campaignTypeId) {
      const [type] = await db
        .select({ id: marketingCampaignTypes.id })
        .from(marketingCampaignTypes)
        .where(eq(marketingCampaignTypes.id, String(body.campaignTypeId)))
        .limit(1);
      if (!type) return NextResponse.json({ error: 'Campaign type not found' }, { status: 404 });
    }

    let budgetValue: string | null | undefined = undefined;
    if (body?.budgetAmount !== undefined) {
      if (body.budgetAmount === null || body.budgetAmount === '') {
        budgetValue = null;
      } else {
        const budgetNum = Number(body.budgetAmount);
        if (!Number.isFinite(budgetNum) || budgetNum < 0) {
          return NextResponse.json({ error: 'budgetAmount must be a valid non-negative number' }, { status: 400 });
        }
        budgetValue = String(budgetNum);
      }
    }

    if (mode === 'own' && body?.ownerUserId && String(body.ownerUserId) !== String(user?.sub || '')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updateData: any = {
      lastUpdatedOnTimestamp: new Date(),
      lastUpdatedByUserId: user?.sub || null,
    };

    if (body?.name !== undefined) updateData.name = String(body.name || '').trim();
    if (body?.description !== undefined) updateData.description = body.description || null;
    if (body?.goals !== undefined) updateData.goals = body.goals || null;
    if (body?.campaignTypeId !== undefined) updateData.campaignTypeId = body.campaignTypeId ? String(body.campaignTypeId) : null;
    if (body?.status !== undefined) updateData.status = parsedStatus ?? 'planned';
    if (body?.startDate !== undefined) updateData.startDate = startDateValue;
    if (body?.endDate !== undefined) updateData.endDate = endDateValue;
    if (budgetValue !== undefined) updateData.budgetAmount = budgetValue;
    if (body?.divisionId !== undefined) updateData.divisionId = normalizeScopeValue(body.divisionId);
    if (body?.departmentId !== undefined) updateData.departmentId = normalizeScopeValue(body.departmentId);
    if (body?.locationId !== undefined) updateData.locationId = normalizeScopeValue(body.locationId);
    if (body?.ownerUserId !== undefined) updateData.ownerUserId = body.ownerUserId || null;

    await db.update(marketingCampaigns).set(updateData).where(eq(marketingCampaigns.id, id as any));

    const [row] = await db
      .select({
        campaign: marketingCampaigns,
        type: {
          id: marketingCampaignTypes.id,
          name: marketingCampaignTypes.name,
          code: marketingCampaignTypes.code,
          color: marketingCampaignTypes.color,
        },
      })
      .from(marketingCampaigns)
      .leftJoin(marketingCampaignTypes, eq(marketingCampaigns.campaignTypeId, marketingCampaignTypes.id))
      .where(eq(marketingCampaigns.id, id as any))
      .limit(1);

    return NextResponse.json({
      ...row.campaign,
      budgetAmount: Number(row.campaign.budgetAmount || 0),
      campaignType: row.type || null,
      campaignTypeName: row.type?.name ?? null,
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDb();
    const { id } = await params;
    const user = extractUserFromRequest(request);

    const mode = await resolveMarketingScopeMode(request, { entity: 'campaigns', verb: 'delete' });
    if (mode === 'none') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const [existing] = await db
      .select({
        id: marketingCampaigns.id,
        ownerUserId: marketingCampaigns.ownerUserId,
        createdByUserId: marketingCampaigns.createdByUserId,
      })
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, id as any))
      .limit(1);
    if (!existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    if (mode === 'own' && !isOwnedByUser(existing, user?.sub || '')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    // 'any' and 'ldd' modes allow access

    await db.delete(marketingCampaigns).where(eq(marketingCampaigns.id, id as any));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
