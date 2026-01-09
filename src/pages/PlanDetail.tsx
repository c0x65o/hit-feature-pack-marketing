'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { BreadcrumbItem } from '@hit/ui-kit';
import { useUi } from '@hit/ui-kit';
import { useAlertDialog } from '@hit/ui-kit/hooks/useAlertDialog';
import { DollarSign, Plus, Trash2, Pencil, Package, ClipboardList } from 'lucide-react';

type Vendor = { id: string; name: string; kind: string };
type ActivityType = { id: string; name: string; color: string | null };

type PlanDetailData = {
  id: string;
  title: string;
  budgetAmount: number;
  actualSpendAmount: number;
  remainingAmount: number;
  startDate: string | null;
  endDate: string | null;
  isArchived: boolean;
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
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}

interface PlanDetailProps {
  id?: string;
  onNavigate?: (path: string) => void;
}

export function PlanDetail({ id, onNavigate }: PlanDetailProps) {
  const router = useRouter();
  const params = useParams();
  const { Page, Card, Button, Badge, Spinner, Alert, Modal, AlertDialog } = useUi();
  const alertDialog = useAlertDialog();

  const planId = id || (typeof (params as any)?.id === 'string' ? String((params as any).id) : '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanDetailData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  }, [onNavigate, router]);

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

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleDelete = async () => {
    if (!planId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/marketing/plans/${encodeURIComponent(planId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to delete plan');
      }
      navigate('/marketing/plans');
    } catch (e: any) {
      console.error('Failed to delete plan:', e);
      await alertDialog.showAlert(e?.message || 'Failed to delete plan', {
        variant: 'error',
        title: 'Delete Failed',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = useMemo(
    () => [
      { label: 'Marketing', href: '/marketing', icon: <Package size={14} /> },
      { label: 'Plans', href: '/marketing/plans', icon: <ClipboardList size={14} /> },
      { label: plan?.title || 'Plan' },
    ],
    [plan?.title]
  );

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
      onNavigate={navigate}
      actions={
        <div className="flex gap-2 items-center">
          <Badge variant={plan.remainingAmount < 0 ? 'error' : 'success'}>
            {plan.remainingAmount < 0 ? 'Over budget' : 'On track'}
          </Badge>
          <Button variant="primary" onClick={() => navigate(`/marketing/plans/${planId}/edit`)}>
            <Pencil size={16} className="mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Budget (USD)</p>
            <p className="text-2xl font-bold font-mono">{formatUsd(plan.budgetAmount)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Actual (USD)</p>
            <p className="text-2xl font-bold font-mono">{formatUsd(plan.actualSpendAmount)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Remaining (USD)</p>
            <p className={`text-2xl font-bold font-mono ${plan.remainingAmount < 0 ? 'text-red-500' : ''}`}>
              {formatUsd(plan.remainingAmount)}
            </p>
          </div>
        </Card>
      </div>

      {/* Plan Info */}
      <Card className="mb-6">
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Plan Type</p>
            <p className="text-base">
              {plan.type ? (
                <span className="flex items-center gap-2">
                  {plan.type.color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.type.color }} />}
                  {plan.type.name}
                </span>
              ) : (
                '—'
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Start Date</p>
            <p className="text-base">{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">End Date</p>
            <p className="text-base">{plan.endDate ? new Date(plan.endDate).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      </Card>

      {/* Expenses Section */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Expenses</h3>
            <Button variant="primary" size="sm" onClick={() => navigate(`/marketing/expenses/new?planId=${planId}`)}>
              <Plus size={16} className="mr-1" />
              Add Expense
            </Button>
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
                    <th className="text-right p-2 text-sm font-medium">Amount (USD)</th>
                    <th className="text-left p-2 text-sm font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.expenses.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => navigate(`/marketing/expenses/${e.id}`)}
                    >
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal open={true} onClose={() => setShowDeleteConfirm(false)} title="Delete Plan">
          <div className="p-4">
            <p className="mb-4">
              Are you sure you want to delete &quot;{plan.title}&quot;? This will also remove all associated expenses. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <AlertDialog {...alertDialog.props} />
    </Page>
  );
}

export default PlanDetail;
