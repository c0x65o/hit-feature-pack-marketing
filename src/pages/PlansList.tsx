'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { useServerDataTableState } from '@hit/ui-kit';
import { Calendar, Plus } from 'lucide-react';

type PlanType = { id: string; name: string; color: string | null };
type Plan = {
  id: string;
  title: string;
  budgetAmount: number;
  monthSpendAmount: number;
  isArchived: boolean;
  type: PlanType | null;
  startDate: string | null;
  endDate: string | null;
};

function formatUsd(n: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}

interface PlansListProps {
  onNavigate?: (path: string) => void;
}

export function PlansList({ onNavigate }: PlansListProps) {
  const router = useRouter();
  const { Page, Card, Button, Badge, DataTable, Alert } = useUi();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serverTable = useServerDataTableState({
    tableId: 'marketing.plans',
    pageSize: 25,
    initialSort: { sortBy: 'createdAt', sortOrder: 'desc' },
    sortWhitelist: ['title', 'createdAt', 'updatedAt', 'budgetAmount', 'isArchived'],
  });

  const navigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  }, [onNavigate, router]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('limit', String(serverTable.query.pageSize));
      params.set('offset', String((serverTable.query.page - 1) * serverTable.query.pageSize));
      if (serverTable.query.search) params.set('search', serverTable.query.search);
      if (serverTable.query.sortBy) params.set('sortBy', serverTable.query.sortBy);
      if (serverTable.query.sortOrder) params.set('sortOrder', serverTable.query.sortOrder);

      const res = await fetch(`/api/marketing/plans?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch plans');
      const plansData = await res.json();
      setPlans(plansData.items || []);
      setTotal(Number(plansData.total || 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [
    serverTable.query.page,
    serverTable.query.pageSize,
    serverTable.query.search,
    serverTable.query.sortBy,
    serverTable.query.sortOrder,
  ]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        sortable: true,
        render: (_v: unknown, row: Plan) => (
          <span className="text-blue-600 font-medium">{row.title}</span>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        render: (_v: unknown, row: Plan) =>
          row.type ? (
            <div className="flex items-center gap-2">
              {row.type.color ? <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.type.color }} /> : null}
              <span className="text-sm">{row.type.name}</span>
            </div>
          ) : (
            '—'
          ),
      },
      { key: 'budgetAmount', label: 'Budget (USD)', sortable: true, render: (_v: unknown, row: Plan) => <span className="font-mono">{formatUsd(row.budgetAmount)}</span> },
      { key: 'monthSpendAmount', label: 'This Month (USD)', sortable: false, render: (_v: unknown, row: Plan) => <span className="font-mono">{formatUsd(row.monthSpendAmount)}</span> },
      {
        key: 'isArchived',
        label: 'Status',
        sortable: true,
        render: (_v: unknown, row: Plan) => <Badge variant={row.isArchived ? 'default' : 'success'}>{row.isArchived ? 'Archived' : 'Active'}</Badge>,
      },
    ],
    [Badge]
  );

  return (
    <Page
      title="Marketing Plans"
      actions={
        <Button variant="primary" onClick={() => navigate('/marketing/plans/new')}>
          <Plus size={16} className="mr-2" /> New Plan
        </Button>
      }
    >
      {error ? (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      ) : null}

      <Card>
        {plans.length === 0 && !loading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Calendar size={40} className="mx-auto mb-3 opacity-60" />
            No plans yet. Create your first marketing plan to get started.
          </div>
        ) : (
          <DataTable
            data={plans}
            columns={columns}
            loading={loading}
            searchable
            exportable
            showColumnVisibility
            total={total}
            {...serverTable.dataTable}
            onRefresh={fetchAll}
            refreshing={loading}
            searchDebounceMs={400}
            onRowClick={(row: Plan) => navigate(`/marketing/plans/${row.id}`)}
          />
        )}
      </Card>
    </Page>
  );
}

export default PlansList;
