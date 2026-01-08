'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUi, useAlertDialog } from '@hit/ui-kit';
import { Trash2, Pencil, Package, Receipt } from 'lucide-react';
function formatUsd(n) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}
export function ExpenseDetail({ id, onNavigate }) {
    const router = useRouter();
    const params = useParams();
    const { Page, Card, Button, Badge, Spinner, Alert, Modal, AlertDialog } = useUi();
    const alertDialog = useAlertDialog();
    const expenseId = id || (typeof params?.id === 'string' ? String(params.id) : '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expense, setExpense] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useCallback((path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else {
            router.push(path);
        }
    }, [onNavigate, router]);
    const fetchExpense = useCallback(async () => {
        if (!expenseId)
            return;
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/marketing/expenses/${encodeURIComponent(expenseId)}`);
            if (!res.ok)
                throw new Error('Failed to fetch expense');
            const data = await res.json();
            setExpense(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load expense');
        }
        finally {
            setLoading(false);
        }
    }, [expenseId]);
    useEffect(() => {
        fetchExpense();
    }, [fetchExpense]);
    const handleDelete = async () => {
        if (!expenseId)
            return;
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
        }
        catch (e) {
            console.error('Failed to delete expense:', e);
            await alertDialog.showAlert(e?.message || 'Failed to delete expense', {
                variant: 'error',
                title: 'Delete Failed',
            });
        }
        finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };
    const breadcrumbs = useMemo(() => [
        { label: 'Marketing', href: '/marketing', icon: _jsx(Package, { size: 14 }) },
        { label: 'Expenses', href: '/marketing/expenses', icon: _jsx(Receipt, { size: 14 }) },
        { label: expense ? formatUsd(expense.amount) : 'Expense' },
    ], [expense]);
    if (loading) {
        return (_jsx(Page, { title: "Expense", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    if (error || !expense) {
        return (_jsx(Page, { title: "Expense", children: _jsx(Alert, { variant: "error", title: "Error", children: error || 'Expense not found' }) }));
    }
    return (_jsxs(Page, { title: `Expense: ${formatUsd(expense.amount)}`, breadcrumbs: breadcrumbs, onNavigate: navigate, actions: _jsxs("div", { className: "flex gap-2 items-center", children: [_jsxs(Button, { variant: "primary", onClick: () => navigate(`/marketing/expenses/${expenseId}/edit`), children: [_jsx(Pencil, { size: 16, className: "mr-2" }), "Edit"] }), _jsxs(Button, { variant: "danger", onClick: () => setShowDeleteConfirm(true), disabled: isDeleting, children: [_jsx(Trash2, { size: 16, className: "mr-2" }), "Delete"] })] }), children: [_jsx(Card, { children: _jsxs("div", { className: "p-6 grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Amount (USD)" }), _jsx("p", { className: "text-2xl font-bold font-mono", children: formatUsd(expense.amount) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Date" }), _jsx("p", { className: "text-lg", children: new Date(expense.occurredAt).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Plan" }), _jsx("p", { className: "text-base", children: expense.plan ? (_jsx("a", { href: `/marketing/plans/${expense.plan.id}`, className: "text-blue-600 hover:underline", onClick: (e) => {
                                            e.preventDefault();
                                            navigate(`/marketing/plans/${expense.plan.id}`);
                                        }, children: expense.plan.title })) : ('—') })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Vendor" }), _jsx("p", { className: "text-base", children: expense.vendor ? (_jsx("a", { href: `/marketing/vendors/${expense.vendor.id}`, className: "text-blue-600 hover:underline", onClick: (e) => {
                                            e.preventDefault();
                                            navigate(`/marketing/vendors/${expense.vendor.id}`);
                                        }, children: expense.vendor.name })) : ('—') })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Activity Type" }), _jsx("p", { className: "text-base", children: expense.type ? (_jsxs("span", { className: "flex items-center gap-2", children: [expense.type.color && _jsx("span", { className: "w-3 h-3 rounded-full", style: { backgroundColor: expense.type.color } }), expense.type.name] })) : ('—') })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Notes" }), _jsx("p", { className: "text-base whitespace-pre-wrap", children: expense.notes || '—' })] })] }) }), showDeleteConfirm && (_jsx(Modal, { open: true, onClose: () => setShowDeleteConfirm(false), title: "Delete Expense", children: _jsxs("div", { className: "p-4", children: [_jsxs("p", { className: "mb-4", children: ["Are you sure you want to delete this expense of ", formatUsd(expense.amount), "? This action cannot be undone."] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { variant: "secondary", onClick: () => setShowDeleteConfirm(false), children: "Cancel" }), _jsx(Button, { variant: "danger", onClick: handleDelete, disabled: isDeleting, children: isDeleting ? 'Deleting...' : 'Delete' })] })] }) })), _jsx(AlertDialog, { ...alertDialog.props })] }));
}
export default ExpenseDetail;
