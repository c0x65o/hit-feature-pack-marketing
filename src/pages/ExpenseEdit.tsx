'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUi, useFormSubmit, type BreadcrumbItem } from '@hit/ui-kit';
import { Package, Receipt } from 'lucide-react';

type Plan = { id: string; title: string };
type Vendor = { id: string; name: string; kind: string };
type ActivityType = { id: string; name: string; color: string | null };

type ExpenseData = {
  id: string;
  occurredAt: string;
  amount: number;
  notes: string | null;
  planId: string | null;
  vendorId: string | null;
  typeId: string | null;
};

function formatUsd(n: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}

interface ExpenseEditProps {
  id?: string;
  onNavigate?: (path: string) => void;
}

export function ExpenseEdit({ id, onNavigate }: ExpenseEditProps) {
  const expenseId = id === 'new' ? undefined : id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { Page, Card, Input, Button, Select, Spinner, TextArea, Alert } = useUi();
  const { submitting, error, fieldErrors, submit, clearError, setFieldErrors, clearFieldError } = useFormSubmit();

  const [loading, setLoading] = useState(!!expenseId);
  const [expense, setExpense] = useState<ExpenseData | null>(null);

  // Lookup data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);

  // Form state
  const initialPlanId = searchParams?.get('planId') || '';
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [amount, setAmount] = useState('0');
  const [planId, setPlanId] = useState(initialPlanId);
  const [vendorId, setVendorId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [notes, setNotes] = useState('');

  const navigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  }, [onNavigate, router]);

  // Fetch expense and lookups
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, vendorsRes, typesRes, expenseRes] = await Promise.all([
          fetch('/api/marketing/plans?limit=500'),
          fetch('/api/marketing/vendors?activeOnly=true&limit=500'),
          fetch('/api/marketing/activity-types?activeOnly=true&limit=500'),
          expenseId ? fetch(`/api/marketing/expenses/${encodeURIComponent(expenseId)}`) : Promise.resolve(null),
        ]);

        if (plansRes.ok) {
          const d = await plansRes.json();
          setPlans((d.items || []).map((p: any) => ({ id: p.id, title: p.title })));
        }
        if (vendorsRes.ok) {
          const d = await vendorsRes.json();
          setVendors(d.items || []);
        }
        if (typesRes.ok) {
          const d = await typesRes.json();
          setActivityTypes(d.items || []);
        }

        if (expenseRes && expenseRes.ok) {
          const data = await expenseRes.json();
          setExpense(data);
          setOccurredAt(data.occurredAt ? new Date(data.occurredAt).toISOString().slice(0, 16) : '');
          setAmount(String(data.amount || 0));
          setPlanId(data.planId || data.plan?.id || '');
          setVendorId(data.vendorId || data.vendor?.id || '');
          setTypeId(data.typeId || data.type?.id || '');
          setNotes(data.notes || '');
        }
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [expenseId]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!occurredAt) {
      errors.occurredAt = 'Date is required';
    }
    if (Number(amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      occurredAt,
      amount: Number(amount) || 0,
      planId: planId || null,
      vendorId: vendorId || null,
      typeId: typeId || null,
      notes: notes || null,
    };

    const result = await submit(async () => {
      if (expenseId) {
        const res = await fetch(`/api/marketing/expenses/${encodeURIComponent(expenseId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Failed to update expense');
        }
        return { id: expenseId };
      } else {
        const res = await fetch('/api/marketing/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Failed to create expense');
        }
        return await res.json();
      }
    });

    if (result && typeof result === 'object' && 'id' in result) {
      navigate(`/marketing/expenses/${result.id}`);
    }
  };

  if (loading) {
    return (
      <Page title="Expense">
        <div className="flex items-center justify-center p-12">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Marketing', href: '/marketing', icon: <Package size={14} /> },
    { label: 'Expenses', href: '/marketing/expenses', icon: <Receipt size={14} /> },
    ...(expenseId && expense ? [{ label: formatUsd(expense.amount), href: `/marketing/expenses/${expenseId}` }] : []),
    { label: expenseId ? 'Edit' : 'New' },
  ];

  return (
    <Page
      title={expenseId ? 'Edit Expense' : 'New Expense'}
      breadcrumbs={breadcrumbs}
      onNavigate={navigate}
    >
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <Alert variant="error" title="Error" onClose={clearError}>
              {error.message}
            </Alert>
          )}

          <Input
            label="Date"
            type="datetime-local"
            value={occurredAt}
            onChange={(v: string) => { setOccurredAt(v); clearFieldError('occurredAt'); }}
            required
            error={fieldErrors.occurredAt}
          />

          <Input
            label="Amount (USD)"
            value={amount}
            onChange={(v: string) => { setAmount(v); clearFieldError('amount'); }}
            required
            error={fieldErrors.amount}
            placeholder="0"
          />

          <Select
            label="Plan"
            options={[
              { value: '', label: '— None —' },
              ...plans.map((p) => ({ value: p.id, label: p.title })),
            ]}
            value={planId}
            onChange={setPlanId}
          />

          <Select
            label="Vendor"
            options={[
              { value: '', label: '— None —' },
              ...vendors.map((v) => ({ value: v.id, label: v.name })),
            ]}
            value={vendorId}
            onChange={setVendorId}
          />

          <Select
            label="Activity Type"
            options={[
              { value: '', label: '— None —' },
              ...activityTypes.map((t) => ({ value: t.id, label: t.name })),
            ]}
            value={typeId}
            onChange={setTypeId}
          />

          <TextArea
            label="Notes"
            value={notes}
            onChange={setNotes}
            rows={4}
            placeholder="Optional notes..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(expenseId ? `/marketing/expenses/${expenseId}` : '/marketing/expenses')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : `${expenseId ? 'Update' : 'Create'} Expense`}
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}

export default ExpenseEdit;
