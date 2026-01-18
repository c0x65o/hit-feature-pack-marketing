/**
 * Marketing Campaigns API
 *
 * GET  - List campaigns
 * POST - Create a new campaign
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingCampaigns, marketingCampaignTypes } from '@/lib/feature-pack-schemas';
import { and, asc, desc, eq, like, or, sql, type AnyColumn } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { extractUserFromRequest } from '../auth';
import { resolveMarketingScopeMode } from '../lib/scope-mode';
import { requireMarketingAction } from '../lib/require-action';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const user = extractUserFromRequest(request);

    // Check read permission and resolve scope mode
    const mode = await resolveMarketingScopeMode(request, { entity: 'campaigns', verb: 'read' });

    if (mode === 'none') {
      return NextResponse.json({ items: [], total: 0, limit: 0, offset: 0 });
    }

    const statusParam = searchParams.get('status');
    if (statusParam && !campaignStatusSet.has(statusParam)) {
      return NextResponse.json(
        { error: `status must be one of: ${CAMPAIGN_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const campaignTypeId = searchParams.get('campaignTypeId') || searchParams.get('typeId');
    const search = (searchParams.get('search') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const sortBy = (searchParams.get('sortBy') || 'startDate').trim();
    const sortOrder = (searchParams.get('sortOrder') || 'desc').trim();

    const sortColumns: Record<string, AnyColumn> = {
      name: marketingCampaigns.name,
      startDate: marketingCampaigns.startDate,
      endDate: marketingCampaigns.endDate,
      status: marketingCampaigns.status,
      budgetAmount: marketingCampaigns.budgetAmount,
      createdOnTimestamp: marketingCampaigns.createdOnTimestamp,
      lastUpdatedOnTimestamp: marketingCampaigns.lastUpdatedOnTimestamp,
      id: marketingCampaigns.id,
    };

    const orderCol = sortColumns[sortBy] ?? marketingCampaigns.startDate;
    const orderDirection = sortOrder === 'asc' ? asc(orderCol) : desc(orderCol);

    const conditions: any[] = [];
    if (statusParam) conditions.push(eq(marketingCampaigns.status, statusParam));
    if (campaignTypeId) conditions.push(eq(marketingCampaigns.campaignTypeId, String(campaignTypeId)));
    if (search) {
      conditions.push(
        or(
          like(marketingCampaigns.name, `%${search}%`),
          like(marketingCampaigns.description, `%${search}%`),
          like(marketingCampaigns.goals, `%${search}%`)
        )!
      );
    }

    // Scope mode filtering
    if (mode === 'own') {
      const ownerKey = user?.sub || '';
      if (!ownerKey) {
        return NextResponse.json({ items: [], total: 0, limit: 0, offset: 0 });
      }
      conditions.push(
        or(eq(marketingCampaigns.ownerUserId, ownerKey), eq(marketingCampaigns.createdByUserId, ownerKey))!
      );
    }
    // 'any' and 'ldd' modes allow all (no filtering needed)

    let query = db
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
      .orderBy(orderDirection, desc(marketingCampaigns.createdOnTimestamp))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(marketingCampaigns);
    const [countRow] = conditions.length > 0 ? await countQuery.where(and(...conditions)) : await countQuery;
    const total = Number(countRow?.count || 0);

    const rows = await query;
    const items = rows.map(({ campaign, type }: any) => ({
      ...campaign,
      budgetAmount: Number(campaign.budgetAmount || 0),
      campaignType: type || null,
      campaignTypeName: type?.name ?? null,
    }));

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const createCheck = await requireMarketingAction(request, 'marketing.campaigns.create');
    if (createCheck) return createCheck;

    const mode = await resolveMarketingScopeMode(request, { entity: 'campaigns', verb: 'write' });
    if (mode === 'none') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const db = getDb();
    const body = await request.json();
    const user = extractUserFromRequest(request);

    if (!user?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      description,
      goals,
      campaignTypeId,
      status,
      startDate,
      endDate,
      budgetAmount,
      ownerUserId,
      divisionId,
      departmentId,
      locationId,
    } = body || {};

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const parsedStatus = parseCampaignStatus(status);
    if (status !== undefined && parsedStatus === null) {
      return NextResponse.json(
        { error: `status must be one of: ${CAMPAIGN_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const startDateValue = parseDateValue(startDate);
    if (startDateValue === 'invalid') {
      return NextResponse.json({ error: 'startDate must be a valid date' }, { status: 400 });
    }
    const endDateValue = parseDateValue(endDate);
    if (endDateValue === 'invalid') {
      return NextResponse.json({ error: 'endDate must be a valid date' }, { status: 400 });
    }

    let budgetValue: string | null = null;
    if (budgetAmount !== undefined && budgetAmount !== null && budgetAmount !== '') {
      const budgetNum = Number(budgetAmount);
      if (!Number.isFinite(budgetNum) || budgetNum < 0) {
        return NextResponse.json({ error: 'budgetAmount must be a valid non-negative number' }, { status: 400 });
      }
      budgetValue = String(budgetNum);
    }

    if (campaignTypeId) {
      const [type] = await db
        .select({ id: marketingCampaignTypes.id })
        .from(marketingCampaignTypes)
        .where(eq(marketingCampaignTypes.id, String(campaignTypeId)))
        .limit(1);
      if (!type) return NextResponse.json({ error: 'Campaign type not found' }, { status: 404 });
    }

    const ownerKey = ownerUserId ? String(ownerUserId).trim() : '';
    let resolvedOwner = ownerKey || user.sub;
    if (mode === 'own') {
      if (ownerKey && ownerKey !== user.sub) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      resolvedOwner = user.sub;
    }

    const now = new Date();
    const [created] = await db
      .insert(marketingCampaigns)
      .values({
        id: randomUUID(),
        name: String(name).trim(),
        description: description || null,
        goals: goals || null,
        campaignTypeId: campaignTypeId ? String(campaignTypeId) : null,
        status: parsedStatus ?? 'planned',
        startDate: startDateValue ?? null,
        endDate: endDateValue ?? null,
        budgetAmount: budgetValue,
        divisionId: normalizeScopeValue(divisionId),
        departmentId: normalizeScopeValue(departmentId),
        locationId: normalizeScopeValue(locationId),
        ownerUserId: resolvedOwner || null,
        createdByUserId: user.sub,
        createdOnTimestamp: now,
        lastUpdatedByUserId: user.sub,
        lastUpdatedOnTimestamp: now,
      })
      .returning();

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
      .where(eq(marketingCampaigns.id, created.id))
      .limit(1);

    return NextResponse.json(
      {
        ...row.campaign,
        budgetAmount: Number(row.campaign.budgetAmount || 0),
        campaignType: row.type || null,
        campaignTypeName: row.type?.name ?? null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
