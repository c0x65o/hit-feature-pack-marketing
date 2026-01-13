'use client';

import React from 'react';
import { Alert } from '@hit/ui-kit';
import { MarketingExpensesEmbeddedTable } from './embeddedTables/MarketingExpensesEmbeddedTable';

export type EmbeddedTableSpec = {
  kind: 'embeddedTable';
  title?: string;
  entityType: string;
  tableId?: string;
  pageSize?: number;
  initialSort?: { sortBy?: string; sortOrder?: 'asc' | 'desc' };
  sortWhitelist?: string[];
  columns?: Array<string | { key: string; label?: string; sortable?: boolean; align?: 'left' | 'center' | 'right' }>;
  /** Query param mappings (server endpoints may have dedicated params like planId) */
  query?: Record<string, { valueFrom: { kind: 'parentField'; field: string } }>;
  /** Optional create route template (may include `{parent.<field>}` tokens) */
  createRoute?: string;
  emptyMessage?: string;
};

export function EmbeddedEntityTable({
  spec,
  parent,
  navigate,
}: {
  spec: EmbeddedTableSpec;
  parent: any;
  navigate: (path: string) => void;
}) {
  const entityType = String(spec?.entityType || '').trim();
  if (!entityType) {
    return <Alert variant="error" title="Missing embedded table entityType">Invalid embedded table spec.</Alert>;
  }

  // Registry by entityType (hook-safe: each renderer is its own component).
  if (entityType === 'marketing.expense') {
    return <MarketingExpensesEmbeddedTable spec={spec} parent={parent} navigate={navigate} />;
  }

  return (
    <Alert variant="warning" title="Unsupported embedded table">
      No embedded table renderer is registered for `{entityType}` yet.
    </Alert>
  );
}

