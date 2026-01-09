'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { useServerDataTableState } from '@hit/ui-kit/hooks/useServerDataTableState';
import { Plus, Receipt } from 'lucide-react';

type Plan = { id: string; title: string };
type Vendor = { id: string; name: string; kind: string };
type ActivityType = { id: string; name: string; color: string | null };

type ExpenseRow = {
  id: string;
  occurredAt: string;
  amount: number;
  notes: string | null;
  plan: Plan | null;
  vendor: Vendor | null;
  type: ActivityType | null;
};

function formatUsd(n: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}

interface ExpensesListProps {
  onNavigate?: (path: string) => void;
}

export function ExpensesList({ onNavigate }: ExpensesListProps) {
  const router = useRouter();
  const { Page, Card, Button, Alert, DataTable } = useUi();

  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serverTable = useServerDataTableState({
    tableId: 'marketing.expenses',
    pageSize: 25,
    initialSort: { sortBy: 'occurredAt', sortOrder: 'desc' },
    sortWhitelist: ['occurredAt', 'amount', 'createdAt'],
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
      const q = new URLSearchParams();
      q.set('limit', String(serverTable.query.pageSize));
      q.set('offset', String((serverTable.query.page - 1) * serverTable.query.pageSize));
      q.set('includeTotals', 'true');
      if (serverTable.query.search) q.set('search', serverTable.query.search);
      if (serverTable.query.sortBy) q.set('sortBy', serverTable.query.sortBy);
      if (serverTable.query.sortOrder) q.set('sortOrder', serverTable.query.sortOrder);

      const res = await fetch(`/api/marketing/expenses?${q.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const eData = await res.json();
      setItems(eData.items || []);
      setTotalAmount(Number(eData?.totals?.totalAmount || 0));
      setTotal(Number(eData?.total || 0));
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
      { key: 'occurredAt', label: 'Date', sortable: true, render: (_v: unknown, row: ExpenseRow) => new Date(row.occurredAt).toLocaleDateString() },
      { key: 'plan', label: 'Plan', render: (_v: unknown, row: ExpenseRow) => row.plan?.title || '—' },
      { key: 'vendor', label: 'Vendor', render: (_v: unknown, row: ExpenseRow) => row.vendor?.name || '—' },
      { key: 'type', label: 'Type', render: (_v: unknown, row: ExpenseRow) => row.type?.name || '—' },
      { key: 'amount', label: 'Amount (USD)', sortable: true, render: (_v: unknown, row: ExpenseRow) => <span className="font-mono">{formatUsd(row.amount)}</span> },
      { key: 'notes', label: 'Notes', render: (_v: unknown, row: ExpenseRow) => row.notes || '—' },
    ],
    []
  );

  return (
    <Page
      title="Marketing Expenses"
      actions={
        <Button variant="primary" onClick={() => navigate('/marketing/expenses/new')}>
          <Plus size={16} className="mr-2" /> New Expense
        </Button>
      }
    >
      {error ? (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      ) : null}

      <div className="mb-3 text-sm text-muted-foreground">
        Total (filtered): <span className="font-mono">{formatUsd(totalAmount)}</span>
      </div>

      <Card>
        {items.length === 0 && !loading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Receipt size={40} className="mx-auto mb-3 opacity-60" />
            No expenses yet. Track your marketing spend by adding expenses.
          </div>
        ) : (
          <DataTable
            data={items}
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
            onRowClick={(row: ExpenseRow) => navigate(`/marketing/expenses/${row.id}`)}
          />
        )}
      </Card>
    </Page>
  );
}

export default ExpensesList;
