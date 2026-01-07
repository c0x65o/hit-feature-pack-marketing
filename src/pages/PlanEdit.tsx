'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUi, useFormSubmit, type BreadcrumbItem } from '@hit/ui-kit';
import { Package, ClipboardList } from 'lucide-react';

type PlanType = { id: string; name: string; color: string | null };
type PlanData = {
  id: string;
  title: string;
  budgetAmount: number;
  typeId: string | null;
  startDate: string | null;
  endDate: string | null;
  isArchived: boolean;
};

interface PlanEditProps {
  id?: string;
  onNavigate?: (path: string) => void;
}

export function PlanEdit({ id, onNavigate }: PlanEditProps) {
  const planId = id === 'new' ? undefined : id;
  const router = useRouter();
  const { Page, Card, Input, Button, Select, Spinner, Alert } = useUi();
  const { submitting, error, fieldErrors, submit, clearError, setFieldErrors, clearFieldError } = useFormSubmit();

  const [loading, setLoading] = useState(!!planId);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [types, setTypes] = useState<PlanType[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('0');
  const [typeId, setTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const navigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  }, [onNavigate, router]);

  // Fetch plan and types
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, planRes] = await Promise.all([
          fetch('/api/marketing/plan-types?activeOnly=true&limit=500'),
          planId ? fetch(`/api/marketing/plans/${encodeURIComponent(planId)}`) : Promise.resolve(null),
        ]);

        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setTypes(typesData.items || []);
        }

        if (planRes && planRes.ok) {
          const planData = await planRes.json();
          setPlan(planData);
          setTitle(planData.title || '');
          setBudgetAmount(String(planData.budgetAmount || 0));
          setTypeId(planData.typeId || planData.type?.id || '');
          setStartDate(planData.startDate ? new Date(planData.startDate).toISOString().slice(0, 10) : '');
          setEndDate(planData.endDate ? new Date(planData.endDate).toISOString().slice(0, 10) : '');
        }
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [planId]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      title: title.trim(),
      budgetAmount: Number(budgetAmount) || 0,
      typeId: typeId || null,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    const result = await submit(async () => {
      if (planId) {
        const res = await fetch(`/api/marketing/plans/${encodeURIComponent(planId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Failed to update plan');
        }
        return { id: planId };
      } else {
        const res = await fetch('/api/marketing/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Failed to create plan');
        }
        return await res.json();
      }
    });

    if (result && typeof result === 'object' && 'id' in result) {
      navigate(`/marketing/plans/${result.id}`);
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

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Marketing', href: '/marketing', icon: <Package size={14} /> },
    { label: 'Plans', href: '/marketing/plans', icon: <ClipboardList size={14} /> },
    ...(planId && plan ? [{ label: plan.title, href: `/marketing/plans/${planId}` }] : []),
    { label: planId ? 'Edit' : 'New' },
  ];

  return (
    <Page
      title={planId ? 'Edit Plan' : 'New Plan'}
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
            label="Title"
            value={title}
            onChange={(v: string) => { setTitle(v); clearFieldError('title'); }}
            required
            error={fieldErrors.title}
            placeholder="e.g. Q1 Launch Campaign"
          />

          <Input
            label="Budget (USD)"
            value={budgetAmount}
            onChange={(v: string) => { setBudgetAmount(v); clearFieldError('budgetAmount'); }}
            error={fieldErrors.budgetAmount}
            placeholder="0"
          />

          <Select
            label="Plan Type"
            options={[
              { value: '', label: '— None —' },
              ...types.map((t) => ({ value: t.id, label: t.name })),
            ]}
            value={typeId}
            onChange={(v: string) => { setTypeId(v); clearFieldError('typeId'); }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={setStartDate}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={setEndDate}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(planId ? `/marketing/plans/${planId}` : '/marketing/plans')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : `${planId ? 'Update' : 'Create'} Plan`}
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}

export default PlanEdit;
