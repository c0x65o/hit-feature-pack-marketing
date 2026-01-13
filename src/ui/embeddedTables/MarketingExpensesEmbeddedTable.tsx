'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useServerDataTableState, useUi } from '@hit/ui-kit';
import { useEntityUiSpec } from '../useHitUiSpecs';
import { useEntityDataTableColumns } from '../entityTable';
import type { EmbeddedTableSpec } from '../EmbeddedEntityTable';

function readParentField(spec: EmbeddedTableSpec, parent: any, queryKey: string): string | null {
  const q = (spec?.query || {}) as any;
  const m = q?.[queryKey];
  if (!m || typeof m !== 'object') return null;
  const vf = m.valueFrom;
  if (!vf || vf.kind !== 'parentField') return null;
  const field = String(vf.field || '').trim();
  if (!field) return null;
  const v = parent?.[field];
  const s = v == null ? '' : String(v).trim();
  return s || null;
}

export function MarketingExpensesEmbeddedTable({
  spec,
  parent,
  navigate,
}: {
  spec: EmbeddedTableSpec;
  parent: any;
  navigate: (path: string) => void;
}) {
  const { Card, Button, DataTable, Spinner } = useUi();

  const planId = readParentField(spec, parent, 'planId') || String(parent?.id || '').trim();

  const expenseUiSpec = useEntityUiSpec('marketing.expense');
  const expenseListSpec = (expenseUiSpec as any)?.list || null;
  const routes = (expenseUiSpec as any)?.meta?.routes || {};

  const tableId = String(spec.tableId || expenseListSpec?.tableId || 'marketing.planExpenses');
  const serverTable = useServerDataTableState({
    tableId,
    pageSize: Number(spec.pageSize || expenseListSpec?.pageSize || 25),
    initialSort: (spec.initialSort as any) || (expenseListSpec?.initialSort as any) || { sortBy: 'occurredAt', sortOrder: 'desc' },
    sortWhitelist: Array.isArray(spec.sortWhitelist) ? spec.sortWhitelist : expenseListSpec?.sortWhitelist,
  });

  const [data, setData] = React.useState<any>({ items: [], pagination: { total: 0 } });
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchData = React.useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('limit', String(serverTable.query.pageSize));
      q.set('offset', String((serverTable.query.page - 1) * serverTable.query.pageSize));
      q.set('planId', planId);
      if (serverTable.query.search) q.set('search', serverTable.query.search);
      if (serverTable.query.sortBy) q.set('sortBy', serverTable.query.sortBy);
      if (serverTable.query.sortOrder) q.set('sortOrder', serverTable.query.sortOrder);

      const res = await fetch(`/api/marketing/expenses?${q.toString()}`);
      const json = res.ok ? await res.json() : null;
      setData({
        items: json?.items || [],
        pagination: { total: Number(json?.total || 0) },
      });
    } finally {
      setLoading(false);
    }
  }, [planId, serverTable.query.page, serverTable.query.pageSize, serverTable.query.search, serverTable.query.sortBy, serverTable.query.sortOrder]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const effectiveListSpec = useMemo(() => {
    if (Array.isArray(spec.columns) && spec.columns.length > 0) {
      const cols = spec.columns.map((c) => (typeof c === 'string' ? { key: c } : c));
      return { ...(expenseListSpec || {}), columns: cols };
    }
    return expenseListSpec || { columns: [] };
  }, [spec.columns, expenseListSpec]);

  const columns = useEntityDataTableColumns({
    listSpec: effectiveListSpec as any,
    fieldsMap: (expenseUiSpec as any)?.fields || null,
    isMobile: false,
    customRenderers: {
      occurredAt: (v) => {
        if (!v) return '—';
        const d = new Date(String(v));
        return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
      },
      amount: (v) => {
        const n = typeof v === 'number' ? v : Number(v);
        const safe = Number.isFinite(n) ? n : 0;
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(safe);
      },
    },
  });

  const title = String(spec.title || 'Expenses');
  const emptyMessage = String(spec.emptyMessage || 'No expenses yet.');
  const createHref = String(spec.createRoute || '').replace('{parent.id}', encodeURIComponent(String(parent?.id ?? '')));
  const detailTpl = String(routes?.detail || '/marketing/expenses/{id}');

  if (!expenseUiSpec) return <Spinner />;

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {createHref ? (
          <Button variant="primary" size="sm" onClick={() => navigate(createHref)}>
            <Plus size={16} className="mr-2" />
            Add
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={loading}
        emptyMessage={emptyMessage}
        onRowClick={(row: Record<string, unknown>) => {
          const id = String((row as any).id || '');
          if (!id) return;
          navigate(detailTpl.replace('{id}', encodeURIComponent(id)));
        }}
        onRefresh={fetchData}
        refreshing={loading}
        total={data?.pagination?.total}
        {...serverTable.dataTable}
        searchDebounceMs={400}
        enableViews={true}
        showColumnVisibility={true}
      />
    </Card>
  );
}

