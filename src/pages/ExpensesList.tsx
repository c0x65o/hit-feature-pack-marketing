'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}

export function ExpensesList() {
  const { Page, Card, Button, Spinner, Alert, DataTable, Modal, Input, TextArea } = useUi();

  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [types, setTypes] = useState<ActivityType[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [amount, setAmount] = useState('0');
  const [planId, setPlanId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [notes, setNotes] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [eRes, pRes, vRes, tRes] = await Promise.all([
        fetch('/api/marketing/expenses?limit=500&includeTotals=true'),
        fetch('/api/marketing/plans?limit=500'),
        fetch('/api/marketing/vendors?activeOnly=true'),
        fetch('/api/marketing/activity-types?activeOnly=true'),
      ]);
      if (!eRes.ok) throw new Error('Failed to fetch expenses');
      const eData = await eRes.json();
      setItems(eData.items || []);
      setTotalAmount(Number(eData?.totals?.totalAmount || 0));
      if (pRes.ok) {
        const pData = await pRes.json();
        setPlans((pData.items || []).map((p: any) => ({ id: String(p.id), title: String(p.title) })));
      }
      if (vRes.ok) {
        const vData = await vRes.json();
        setVendors(vData.items || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTypes(tData.items || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const columns = useMemo(
    () => [
      { key: 'occurredAt', label: 'Date', render: (_v: unknown, row: ExpenseRow) => new Date(row.occurredAt).toLocaleDateString() },
      { key: 'plan', label: 'Plan', render: (_v: unknown, row: ExpenseRow) => row.plan?.title || '—' },
      { key: 'vendor', label: 'Vendor', render: (_v: unknown, row: ExpenseRow) => row.vendor?.name || '—' },
      { key: 'type', label: 'Type', render: (_v: unknown, row: ExpenseRow) => row.type?.name || '—' },
      { key: 'amount', label: 'Amount', render: (_v: unknown, row: ExpenseRow) => <span className="font-mono">{formatUsd(row.amount)}</span> },
      { key: 'notes', label: 'Notes', render: (_v: unknown, row: ExpenseRow) => row.notes || '—' },
    ],
    []
  );

  const createExpense = async () => {
    try {
      setCreating(true);
      setError(null);
      const res = await fetch('/api/marketing/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occurredAt,
          amount: Number(amount || 0),
          planId: planId || null,
          vendorId: vendorId || null,
          typeId: typeId || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to create expense');
      }
      setShowCreate(false);
      setAmount('0');
      setPlanId('');
      setVendorId('');
      setTypeId('');
      setNotes('');
      setOccurredAt(new Date().toISOString().slice(0, 16));
      await fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create expense');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Page
      title="Marketing Expenses"
      actions={
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New expense
        </Button>
      }
    >
      {error ? (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      ) : null}

      <div className="mb-3 text-sm text-muted-foreground">
        Total (loaded): <span className="font-mono">{formatUsd(totalAmount)}</span>
      </div>

      <Card>
        {items.length === 0 && !loading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Receipt size={40} className="mx-auto mb-3 opacity-60" />
            No expenses yet.
          </div>
        ) : (
          <DataTable
            data={items}
            columns={columns}
            loading={loading}
            searchable
            exportable
            showColumnVisibility
            tableId="marketing.expenses"
            onRefresh={fetchAll}
            refreshing={loading}
            searchDebounceMs={400}
            onRowClick={() => {}}
          />
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New expense">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium">When *</label>
            <Input type="datetime-local" value={occurredAt} onChange={setOccurredAt} />
          </div>
          <div>
            <label className="text-sm font-medium">Amount *</label>
            <Input value={amount} onChange={setAmount} />
          </div>
          <div>
            <label className="text-sm font-medium">Plan</label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full border rounded px-2 py-2 bg-background text-sm">
              <option value="">—</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Vendor</label>
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full border rounded px-2 py-2 bg-background text-sm">
              <option value="">—</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Activity type</label>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="w-full border rounded px-2 py-2 bg-background text-sm">
              <option value="">—</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <TextArea value={notes} onChange={setNotes} rows={3} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createExpense} disabled={creating || !occurredAt || Number(amount) <= 0}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

export default ExpensesList;


