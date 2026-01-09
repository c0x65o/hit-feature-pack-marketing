'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { useAlertDialog } from '@hit/ui-kit/hooks/useAlertDialog';
import { DollarSign, Plus, Trash2, Pencil, Package, ClipboardList } from 'lucide-react';
function formatUsd(n) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}
export function PlanDetail({ id, onNavigate }) {
    const router = useRouter();
    const params = useParams();
    const { Page, Card, Button, Badge, Spinner, Alert, Modal, AlertDialog } = useUi();
    const alertDialog = useAlertDialog();
    const planId = id || (typeof params?.id === 'string' ? String(params.id) : '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [plan, setPlan] = useState(null);
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
    const fetchPlan = useCallback(async () => {
        if (!planId)
            return;
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/marketing/plans/${encodeURIComponent(planId)}`);
            if (!res.ok)
                throw new Error('Failed to fetch plan');
            const data = await res.json();
            setPlan(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load plan');
        }
        finally {
            setLoading(false);
        }
    }, [planId]);
    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);
    const handleDelete = async () => {
        if (!planId)
            return;
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
        }
        catch (e) {
            console.error('Failed to delete plan:', e);
            await alertDialog.showAlert(e?.message || 'Failed to delete plan', {
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
        { label: 'Plans', href: '/marketing/plans', icon: _jsx(ClipboardList, { size: 14 }) },
        { label: plan?.title || 'Plan' },
    ], [plan?.title]);
    if (loading) {
        return (_jsx(Page, { title: "Plan", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    if (error || !plan) {
        return (_jsx(Page, { title: "Plan", children: _jsx(Alert, { variant: "error", title: "Error", children: error || 'Plan not found' }) }));
    }
    return (_jsxs(Page, { title: plan.title, breadcrumbs: breadcrumbs, onNavigate: navigate, actions: _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx(Badge, { variant: plan.remainingAmount < 0 ? 'error' : 'success', children: plan.remainingAmount < 0 ? 'Over budget' : 'On track' }), _jsxs(Button, { variant: "primary", onClick: () => navigate(`/marketing/plans/${planId}/edit`), children: [_jsx(Pencil, { size: 16, className: "mr-2" }), "Edit"] }), _jsxs(Button, { variant: "danger", onClick: () => setShowDeleteConfirm(true), disabled: isDeleting, children: [_jsx(Trash2, { size: 16, className: "mr-2" }), "Delete"] })] }), children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsx(Card, { children: _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Budget (USD)" }), _jsx("p", { className: "text-2xl font-bold font-mono", children: formatUsd(plan.budgetAmount) })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Actual (USD)" }), _jsx("p", { className: "text-2xl font-bold font-mono", children: formatUsd(plan.actualSpendAmount) })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Remaining (USD)" }), _jsx("p", { className: `text-2xl font-bold font-mono ${plan.remainingAmount < 0 ? 'text-red-500' : ''}`, children: formatUsd(plan.remainingAmount) })] }) })] }), _jsx(Card, { className: "mb-6", children: _jsxs("div", { className: "p-4 grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Plan Type" }), _jsx("p", { className: "text-base", children: plan.type ? (_jsxs("span", { className: "flex items-center gap-2", children: [plan.type.color && _jsx("span", { className: "w-3 h-3 rounded-full", style: { backgroundColor: plan.type.color } }), plan.type.name] })) : ('—') })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Start Date" }), _jsx("p", { className: "text-base", children: plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '—' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "End Date" }), _jsx("p", { className: "text-base", children: plan.endDate ? new Date(plan.endDate).toLocaleDateString() : '—' })] })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Expenses" }), _jsxs(Button, { variant: "primary", size: "sm", onClick: () => navigate(`/marketing/expenses/new?planId=${planId}`), children: [_jsx(Plus, { size: 16, className: "mr-1" }), "Add Expense"] })] }), plan.expenses.length === 0 ? (_jsxs("div", { className: "text-center py-10 text-muted-foreground", children: [_jsx(DollarSign, { size: 40, className: "mx-auto mb-3 opacity-60" }), "No expenses yet."] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left p-2 text-sm font-medium", children: "Date" }), _jsx("th", { className: "text-left p-2 text-sm font-medium", children: "Vendor" }), _jsx("th", { className: "text-left p-2 text-sm font-medium", children: "Type" }), _jsx("th", { className: "text-right p-2 text-sm font-medium", children: "Amount (USD)" }), _jsx("th", { className: "text-left p-2 text-sm font-medium", children: "Notes" })] }) }), _jsx("tbody", { children: plan.expenses.map((e) => (_jsxs("tr", { className: "border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer", onClick: () => navigate(`/marketing/expenses/${e.id}`), children: [_jsx("td", { className: "p-2 text-sm", children: new Date(e.occurredAt).toLocaleDateString() }), _jsx("td", { className: "p-2 text-sm", children: e.vendor?.name || '—' }), _jsx("td", { className: "p-2 text-sm", children: e.type?.name || '—' }), _jsx("td", { className: "p-2 text-sm text-right font-mono font-medium", children: formatUsd(e.amount) }), _jsx("td", { className: "p-2 text-sm text-muted-foreground", children: e.notes || '—' })] }, e.id))) })] }) }))] }) }), showDeleteConfirm && (_jsx(Modal, { open: true, onClose: () => setShowDeleteConfirm(false), title: "Delete Plan", children: _jsxs("div", { className: "p-4", children: [_jsxs("p", { className: "mb-4", children: ["Are you sure you want to delete \"", plan.title, "\"? This will also remove all associated expenses. This action cannot be undone."] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { variant: "secondary", onClick: () => setShowDeleteConfirm(false), children: "Cancel" }), _jsx(Button, { variant: "danger", onClick: handleDelete, disabled: isDeleting, children: isDeleting ? 'Deleting...' : 'Delete' })] })] }) })), _jsx(AlertDialog, { ...alertDialog.props })] }));
}
export default PlanDetail;
