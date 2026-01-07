import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { marketingEntityLinks } from '@/lib/feature-pack-schemas';
import { getMarketingOptionsFromRequest } from '../auth';

export type MarketingEntityType = 'plan' | 'expense';

export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function getProjectLinkingPolicy(request: NextRequest): {
  enabled: boolean;
  required: boolean;
} {
  const opts = getMarketingOptionsFromRequest(request);
  const enabled = Boolean(opts.enable_project_linking);
  const required = enabled && Boolean(opts.require_project_linking);
  return { enabled, required };
}

export async function getLinkedProjectId(
  db: any,
  marketingEntityType: MarketingEntityType,
  marketingEntityId: string
): Promise<string | null> {
  const [row] = await db
    .select({ linkedEntityId: marketingEntityLinks.linkedEntityId })
    .from(marketingEntityLinks)
    .where(
      and(
        eq(marketingEntityLinks.marketingEntityType, marketingEntityType),
        eq(marketingEntityLinks.marketingEntityId, marketingEntityId as any),
        eq(marketingEntityLinks.linkedEntityKind, 'project')
      )
    )
    .limit(1);
  return row?.linkedEntityId ? String(row.linkedEntityId) : null;
}

export async function setLinkedProjectId(
  db: any,
  marketingEntityType: MarketingEntityType,
  marketingEntityId: string,
  projectId: string | null
): Promise<void> {
  // Remove any existing project links for this entity
  await db
    .delete(marketingEntityLinks)
    .where(
      and(
        eq(marketingEntityLinks.marketingEntityType, marketingEntityType),
        eq(marketingEntityLinks.marketingEntityId, marketingEntityId as any),
        eq(marketingEntityLinks.linkedEntityKind, 'project')
      )
    );

  if (!projectId) return;

  const now = new Date();
  await db.insert(marketingEntityLinks).values({
    id: crypto.randomUUID(),
    marketingEntityType,
    marketingEntityId: marketingEntityId as any,
    linkedEntityKind: 'project',
    linkedEntityId: projectId as any,
    metadata: null,
    createdAt: now,
    updatedAt: now,
  });
}
