'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUi, type BreadcrumbItem } from '@hit/ui-kit';
import { DollarSign, Plus } from 'lucide-react';

type Vendor = { id: string; name: string; kind: string };
type ActivityType = { id: string; name: string; color: string | null };

type PlanDetail = {
  id: string;
  title: string;
  budgetAmount: number;
  actualSpendAmount: number;
  remainingAmount: number;
  type: { id: string; name: string; color: string | null } | null;
  expenses: Array<{
    id: string;
    occurredAt: string;
    amount: number;
    notes: string | null;
    vendor: Vendor | null;
    type: ActivityType | null;
  }>;
};

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}

export function PlanDetail() {
  const router = useRouter();
  const params = useParams();
  const { Page, Card, Button, Badge, Spinner, Alert, Modal, Input, TextArea } = useUi();

  const planId = typeof (params as any)?.id === 'string' ? String((params as any).id) : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanDetail | null>(null);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [creatingExpense, setCreatingExpense] = useState(false);
  const [expenseOccurredAt, setExpenseOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [expenseAmount, setExpenseAmount] = useState('0');
  const [expenseVendorId, setExpenseVendorId] = useState('');
  const [expenseTypeId, setExpenseTypeId] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  const fetchPlan = useCallback(async () => {
    if (!planId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/marketing/plans/${encodeURIComponent(planId)}`);
      if (!res.ok) throw new Error('Failed to fetch plan');
      const data = await res.json();
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  const fetchLookups = useCallback(async () => {
    try {
      const [vRes, tRes] = await Promise.all([
        fetch('/api/marketing/vendors?activeOnly=true'),
        fetch('/api/marketing/activity-types?activeOnly=true'),
      ]);
      if (vRes.ok) {
        const j = await vRes.json();
        setVendors(j.items || []);
      }
      if (tRes.ok) {
        const j = await tRes.json();
        setActivityTypes(j.items || []);
      }
    } catch {
      // ignore lookup failures (page still usable)
    }
  }, []);

  useEffect(() => {
    fetchPlan();
    fetchLookups();
  }, [fetchPlan, fetchLookups]);

  const breadcrumbs: BreadcrumbItem[] = useMemo(
    () => [
      { label: 'Marketing', href: '/marketing' },
      { label: 'Plans', href: '/marketing/plans' },
      { label: plan?.title || 'Plan' },
    ],
    [plan?.title]
  );

  const createExpense = async () => {
    if (!planId) return;
    try {
      setCreatingExpense(true);
      setError(null);
      const res = await fetch('/api/marketing/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          occurredAt: expenseOccurredAt,
          amount: Number(expenseAmount || 0),
          vendorId: expenseVendorId || null,
          typeId: expenseTypeId || null,
          notes: expenseNotes || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to create expense');
      }
      setShowAddExpense(false);
      setExpenseAmount('0');
      setExpenseVendorId('');
      setExpenseTypeId('');
      setExpenseNotes('');
      setExpenseOccurredAt(new Date().toISOString().slice(0, 16));
      await fetchPlan();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create expense');
    } finally {
      setCreatingExpense(false);
    }
  };

  if (loading) {
    return (
      <Page title="Plan">
        <div className="flex items-center justify-center p-12">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  if (error || !plan) {
    return (
      <Page title="Plan">
        <Alert variant="error" title="Error">
          {error || 'Plan not found'}
        </Alert>
      </Page>
    );
  }

  return (
    <Page
      title={plan.title}
      breadcrumbs={breadcrumbs}
      onNavigate={(path: string) => router.push(path)}
      actions={
        <div className="flex gap-2 items-center">
          <Badge variant={plan.remainingAmount < 0 ? 'error' : 'success'}>
            {plan.remainingAmount < 0 ? 'Over budget' : 'On track'}
          </Badge>
          <Button variant="primary" onClick={() => setShowAddExpense(true)}>
            <Plus size={16} className="mr-2" />
            Add expense
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Budget</p>
            <p className="text-2xl font-bold font-mono">{formatUsd(plan.budgetAmount)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Actual</p>
            <p className="text-2xl font-bold font-mono">{formatUsd(plan.actualSpendAmount)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Remaining</p>
            <p className="text-2xl font-bold font-mono">{formatUsd(plan.remainingAmount)}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Expenses</h3>
          </div>
          {plan.expenses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <DollarSign size={40} className="mx-auto mb-3 opacity-60" />
              No expenses yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Date</th>
                    <th className="text-left p-2 text-sm font-medium">Vendor</th>
                    <th className="text-left p-2 text-sm font-medium">Type</th>
                    <th className="text-right p-2 text-sm font-medium">Amount</th>
                    <th className="text-left p-2 text-sm font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.expenses.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-2 text-sm">{new Date(e.occurredAt).toLocaleDateString()}</td>
                      <td className="p-2 text-sm">{e.vendor?.name || '—'}</td>
                      <td className="p-2 text-sm">{e.type?.name || '—'}</td>
                      <td className="p-2 text-sm text-right font-mono font-medium">{formatUsd(e.amount)}</td>
                      <td className="p-2 text-sm text-muted-foreground">{e.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Modal open={showAddExpense} onClose={() => setShowAddExpense(false)} title="Add expense">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium">When *</label>
            <Input type="datetime-local" value={expenseOccurredAt} onChange={setExpenseOccurredAt} />
          </div>
          <div>
            <label className="text-sm font-medium">Amount *</label>
            <Input value={expenseAmount} onChange={setExpenseAmount} />
          </div>
          <div>
            <label className="text-sm font-medium">Vendor</label>
            <select
              value={expenseVendorId}
              onChange={(e) => setExpenseVendorId(e.target.value)}
              className="w-full border rounded px-2 py-2 bg-background text-sm"
            >
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
            <select
              value={expenseTypeId}
              onChange={(e) => setExpenseTypeId(e.target.value)}
              className="w-full border rounded px-2 py-2 bg-background text-sm"
            >
              <option value="">—</option>
              {activityTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <TextArea value={expenseNotes} onChange={setExpenseNotes} rows={3} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddExpense(false)} disabled={creatingExpense}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={createExpense}
              disabled={creatingExpense || !expenseOccurredAt || Number(expenseAmount) <= 0}
            >
              {creatingExpense ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

export default PlanDetail;


