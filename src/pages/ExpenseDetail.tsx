'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { BreadcrumbItem } from '@hit/ui-kit';
import { useUi } from '@hit/ui-kit';
import { useAlertDialog } from '@hit/ui-kit/hooks/useAlertDialog';
import { Trash2, Pencil, Package, Receipt } from 'lucide-react';

type ExpenseData = {
  id: string;
  occurredAt: string;
  amount: number;
  notes: string | null;
  plan: { id: string; title: string } | null;
  vendor: { id: string; name: string; kind: string } | null;
  type: { id: string; name: string; color: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

function formatUsd(n: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}

interface ExpenseDetailProps {
  id?: string;
  onNavigate?: (path: string) => void;
}

export function ExpenseDetail({ id, onNavigate }: ExpenseDetailProps) {
  const router = useRouter();
  const params = useParams();
  const { Page, Card, Button, Badge, Spinner, Alert, Modal, AlertDialog } = useUi();
  const alertDialog = useAlertDialog();

  const expenseId = id || (typeof (params as any)?.id === 'string' ? String((params as any).id) : '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expense, setExpense] = useState<ExpenseData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  }, [onNavigate, router]);

  const fetchExpense = useCallback(async () => {
    if (!expenseId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/marketing/expenses/${encodeURIComponent(expenseId)}`);
      if (!res.ok) throw new Error('Failed to fetch expense');
      const data = await res.json();
      setExpense(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expense');
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  const handleDelete = async () => {
    if (!expenseId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/marketing/expenses/${encodeURIComponent(expenseId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to delete expense');
      }
      navigate('/marketing/expenses');
    } catch (e: any) {
      console.error('Failed to delete expense:', e);
      await alertDialog.showAlert(e?.message || 'Failed to delete expense', {
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
      { label: 'Expenses', href: '/marketing/expenses', icon: <Receipt size={14} /> },
      { label: expense ? formatUsd(expense.amount) : 'Expense' },
    ],
    [expense]
  );

  if (loading) {
    return (
      <Page title="Expense">
        <div className="flex items-center justify-center p-12">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  if (error || !expense) {
    return (
      <Page title="Expense">
        <Alert variant="error" title="Error">
          {error || 'Expense not found'}
        </Alert>
      </Page>
    );
  }

  return (
    <Page
      title={`Expense: ${formatUsd(expense.amount)}`}
      breadcrumbs={breadcrumbs}
      onNavigate={navigate}
      actions={
        <div className="flex gap-2 items-center">
          <Button variant="primary" onClick={() => navigate(`/marketing/expenses/${expenseId}/edit`)}>
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
      <Card>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Amount (USD)</p>
            <p className="text-2xl font-bold font-mono">{formatUsd(expense.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Date</p>
            <p className="text-lg">{new Date(expense.occurredAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Plan</p>
            <p className="text-base">
              {expense.plan ? (
                <a
                  href={`/marketing/plans/${expense.plan.id}`}
                  className="text-blue-600 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/marketing/plans/${expense.plan!.id}`);
                  }}
                >
                  {expense.plan.title}
                </a>
              ) : (
                '—'
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Vendor</p>
            <p className="text-base">
              {expense.vendor ? (
                <a
                  href={`/marketing/vendors/${expense.vendor.id}`}
                  className="text-blue-600 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/marketing/vendors/${expense.vendor!.id}`);
                  }}
                >
                  {expense.vendor.name}
                </a>
              ) : (
                '—'
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Activity Type</p>
            <p className="text-base">
              {expense.type ? (
                <span className="flex items-center gap-2">
                  {expense.type.color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: expense.type.color }} />}
                  {expense.type.name}
                </span>
              ) : (
                '—'
              )}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p className="text-base whitespace-pre-wrap">{expense.notes || '—'}</p>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal open={true} onClose={() => setShowDeleteConfirm(false)} title="Delete Expense">
          <div className="p-4">
            <p className="mb-4">
              Are you sure you want to delete this expense of {formatUsd(expense.amount)}? This action cannot be undone.
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

export default ExpenseDetail;
