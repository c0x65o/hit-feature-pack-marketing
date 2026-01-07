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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}

export function PlansList() {
  const router = useRouter();
  const { Page, Card, Button, Badge, Spinner, Alert, DataTable, Modal, Input } = useUi();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [types, setTypes] = useState<PlanType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serverTable = useServerDataTableState({
    tableId: 'marketing.plans',
    pageSize: 25,
    initialSort: { sortBy: 'createdAt', sortOrder: 'desc' },
    sortWhitelist: ['title', 'createdAt', 'updatedAt', 'budgetAmount', 'isArchived'],
  });

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBudget, setNewBudget] = useState('0');
  const [newTypeId, setNewTypeId] = useState<string>('');

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

      const [plansRes, typesRes] = await Promise.all([
        fetch(`/api/marketing/plans?${params.toString()}`),
        // Keep types list as small/reference data
        fetch('/api/marketing/plan-types?activeOnly=true&limit=500&offset=0'),
      ]);
      if (!plansRes.ok) throw new Error('Failed to fetch plans');
      if (!typesRes.ok) throw new Error('Failed to fetch plan types');
      const plansData = await plansRes.json();
      const typesData = await typesRes.json();
      setPlans(plansData.items || []);
      setTotal(Number(plansData.total || 0));
      setTypes(typesData.items || []);
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
          <a
            href={`/marketing/plans/${row.id}`}
            className="text-blue-600 hover:underline font-medium"
            onClick={(e) => {
              e.preventDefault();
              router.push(`/marketing/plans/${row.id}`);
            }}
          >
            {row.title}
          </a>
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
      { key: 'budgetAmount', label: 'Budget', sortable: true, render: (_v: unknown, row: Plan) => <span className="font-mono">{formatUsd(row.budgetAmount)}</span> },
      { key: 'monthSpendAmount', label: 'This month', sortable: false, render: (_v: unknown, row: Plan) => <span className="font-mono">{formatUsd(row.monthSpendAmount)}</span> },
      {
        key: 'isArchived',
        label: 'Status',
        sortable: true,
        render: (_v: unknown, row: Plan) => <Badge variant={row.isArchived ? 'default' : 'success'}>{row.isArchived ? 'Archived' : 'Active'}</Badge>,
      },
    ],
    [router, Badge]
  );

  const createPlan = async () => {
    try {
      setCreating(true);
      setError(null);
      const res = await fetch('/api/marketing/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          budgetAmount: Number(newBudget || 0),
          typeId: newTypeId || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to create plan');
      }
      setShowCreate(false);
      setNewTitle('');
      setNewBudget('0');
      setNewTypeId('');
      await fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create plan');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Page
      title="Marketing Plans"
      actions={
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New plan
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
            No plans yet.
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
            onRowClick={(row: any) => router.push(`/marketing/plans/${row?.id}`)}
          />
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New plan">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input value={newTitle} onChange={setNewTitle} placeholder="e.g. Winter campaign" />
          </div>
          <div>
            <label className="text-sm font-medium">Budget</label>
            <Input value={newBudget} onChange={setNewBudget} placeholder="0" />
          </div>
          <div>
            <label className="text-sm font-medium">Plan type</label>
            <select
              value={newTypeId}
              onChange={(e) => setNewTypeId(e.target.value)}
              className="w-full border rounded px-2 py-2 bg-background text-sm"
            >
              <option value="">—</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createPlan} disabled={creating || !newTitle.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

export default PlansList;


