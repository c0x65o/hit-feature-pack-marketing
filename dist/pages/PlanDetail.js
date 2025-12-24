'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { DollarSign, Plus } from 'lucide-react';
function formatUsd(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}
export function PlanDetail() {
    const router = useRouter();
    const params = useParams();
    const { Page, Card, Button, Badge, Spinner, Alert, Modal, Input, TextArea } = useUi();
    const planId = typeof params?.id === 'string' ? String(params.id) : '';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [plan, setPlan] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [activityTypes, setActivityTypes] = useState([]);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [creatingExpense, setCreatingExpense] = useState(false);
    const [expenseOccurredAt, setExpenseOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
    const [expenseAmount, setExpenseAmount] = useState('0');
    const [expenseVendorId, setExpenseVendorId] = useState('');
    const [expenseTypeId, setExpenseTypeId] = useState('');
    const [expenseNotes, setExpenseNotes] = useState('');
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
        }
        catch {
            // ignore lookup failures (page still usable)
        }
    }, []);
    useEffect(() => {
        fetchPlan();
        fetchLookups();
    }, [fetchPlan, fetchLookups]);
    const breadcrumbs = useMemo(() => [
        { label: 'Marketing', href: '/marketing' },
        { label: 'Plans', href: '/marketing/plans' },
        { label: plan?.title || 'Plan' },
    ], [plan?.title]);
    const createExpense = async () => {
        if (!planId)
            return;
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
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create expense');
        }
        finally {
            setCreatingExpense(false);
        }
    };
    if (loading) {
        return (_jsx(Page, { title: "Plan", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    if (error || !plan) {
        return (_jsx(Page, { title: "Plan", children: _jsx(Alert, { variant: "error", title: "Error", children: error || 'Plan not found' }) }));
    }
    return (_jsxs(Page, { title: plan.title, breadcrumbs: breadcrumbs, onNavigate: (path) => router.push(path), actions: _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx(Badge, { variant: plan.remainingAmount < 0 ? 'error' : 'success', children: plan.remainingAmount < 0 ? 'Over budget' : 'On track' }), _jsxs(Button, { variant: "primary", onClick: () => setShowAddExpense(true), children: [_jsx(Plus, { size: 16, className: "mr-2" }), "Add expense"] })] }), children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsx(Card, { children: _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Budget" }), _jsx("p", { className: "text-2xl font-bold font-mono", children: formatUsd(plan.budgetAmount) })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Actual" }), _jsx("p", { className: "text-2xl font-bold font-mono", children: formatUsd(plan.actualSpendAmount) })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Remaining" }), _jsx("p", { className: "text-2xl font-bold font-mono", children: formatUsd(plan.remainingAmount) })] }) })] }), _jsx(Card, { children: _jsxs("div", { className: "p-4", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx("h3", { className: "text-lg font-semibold", children: "Expenses" }) }), plan.expenses.length === 0 ? (_jsxs("div", { className: "text-center py-10 text-muted-foreground", children: [_jsx(DollarSign, { size: 40, className: "mx-auto mb-3 opacity-60" }), "No expenses yet."] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left p-2 text-sm font-medium", children: "Date" }), _jsx("th", { className: "text-left p-2 text-sm font-medium", children: "Vendor" }), _jsx("th", { className: "text-left p-2 text-sm font-medium", children: "Type" }), _jsx("th", { className: "text-right p-2 text-sm font-medium", children: "Amount" }), _jsx("th", { className: "text-left p-2 text-sm font-medium", children: "Notes" })] }) }), _jsx("tbody", { children: plan.expenses.map((e) => (_jsxs("tr", { className: "border-b hover:bg-gray-50 dark:hover:bg-gray-800", children: [_jsx("td", { className: "p-2 text-sm", children: new Date(e.occurredAt).toLocaleDateString() }), _jsx("td", { className: "p-2 text-sm", children: e.vendor?.name || '—' }), _jsx("td", { className: "p-2 text-sm", children: e.type?.name || '—' }), _jsx("td", { className: "p-2 text-sm text-right font-mono font-medium", children: formatUsd(e.amount) }), _jsx("td", { className: "p-2 text-sm text-muted-foreground", children: e.notes || '—' })] }, e.id))) })] }) }))] }) }), _jsx(Modal, { open: showAddExpense, onClose: () => setShowAddExpense(false), title: "Add expense", children: _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "When *" }), _jsx(Input, { type: "datetime-local", value: expenseOccurredAt, onChange: setExpenseOccurredAt })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Amount *" }), _jsx(Input, { value: expenseAmount, onChange: setExpenseAmount })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Vendor" }), _jsxs("select", { value: expenseVendorId, onChange: (e) => setExpenseVendorId(e.target.value), className: "w-full border rounded px-2 py-2 bg-background text-sm", children: [_jsx("option", { value: "", children: "\u2014" }), vendors.map((v) => (_jsx("option", { value: v.id, children: v.name }, v.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Activity type" }), _jsxs("select", { value: expenseTypeId, onChange: (e) => setExpenseTypeId(e.target.value), className: "w-full border rounded px-2 py-2 bg-background text-sm", children: [_jsx("option", { value: "", children: "\u2014" }), activityTypes.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Notes" }), _jsx(TextArea, { value: expenseNotes, onChange: setExpenseNotes, rows: 3, placeholder: "Optional" })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setShowAddExpense(false), disabled: creatingExpense, children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: createExpense, disabled: creatingExpense || !expenseOccurredAt || Number(expenseAmount) <= 0, children: creatingExpense ? 'Adding…' : 'Add' })] })] }) })] }));
}
export default PlanDetail;
