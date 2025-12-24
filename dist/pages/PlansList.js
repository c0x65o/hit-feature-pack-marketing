'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { Calendar, Plus } from 'lucide-react';
function formatUsd(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}
export function PlansList() {
    const router = useRouter();
    const { Page, Card, Button, Badge, Spinner, Alert, DataTable, Modal, Input } = useUi();
    const [plans, setPlans] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newBudget, setNewBudget] = useState('0');
    const [newTypeId, setNewTypeId] = useState('');
    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [plansRes, typesRes] = await Promise.all([
                fetch('/api/marketing/plans?limit=500'),
                fetch('/api/marketing/plan-types?activeOnly=true'),
            ]);
            if (!plansRes.ok)
                throw new Error('Failed to fetch plans');
            if (!typesRes.ok)
                throw new Error('Failed to fetch plan types');
            const plansData = await plansRes.json();
            const typesData = await typesRes.json();
            setPlans(plansData.items || []);
            setTypes(typesData.items || []);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchAll();
    }, [fetchAll]);
    const columns = useMemo(() => [
        {
            key: 'title',
            label: 'Title',
            render: (_v, row) => (_jsx("a", { href: `/marketing/plans/${row.id}`, className: "text-blue-600 hover:underline font-medium", onClick: (e) => {
                    e.preventDefault();
                    router.push(`/marketing/plans/${row.id}`);
                }, children: row.title })),
        },
        {
            key: 'type',
            label: 'Type',
            render: (_v, row) => row.type ? (_jsxs("div", { className: "flex items-center gap-2", children: [row.type.color ? _jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: row.type.color } }) : null, _jsx("span", { className: "text-sm", children: row.type.name })] })) : ('—'),
        },
        { key: 'budgetAmount', label: 'Budget', render: (_v, row) => _jsx("span", { className: "font-mono", children: formatUsd(row.budgetAmount) }) },
        { key: 'monthSpendAmount', label: 'This month', render: (_v, row) => _jsx("span", { className: "font-mono", children: formatUsd(row.monthSpendAmount) }) },
        {
            key: 'isArchived',
            label: 'Status',
            render: (_v, row) => _jsx(Badge, { variant: row.isArchived ? 'default' : 'success', children: row.isArchived ? 'Archived' : 'Active' }),
        },
    ], [router, Badge]);
    const createPlan = async () => {
        try {
            setCreating(true);
            setError(null);
            const res = await fetch('/api/marketing/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    budgetAmount: Number(newBudget || 0),
                    typeId: newTypeId || null,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || 'Failed to create plan');
            }
            setShowCreate(false);
            setNewTitle('');
            setNewBudget('0');
            setNewTypeId('');
            await fetchAll();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create plan');
        }
        finally {
            setCreating(false);
        }
    };
    if (loading) {
        return (_jsx(Page, { title: "Marketing Plans", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    return (_jsxs(Page, { title: "Marketing Plans", actions: _jsxs(Button, { variant: "primary", onClick: () => setShowCreate(true), children: [_jsx(Plus, { size: 16, className: "mr-2" }), " New plan"] }), children: [error ? (_jsx(Alert, { variant: "error", title: "Error", children: error })) : null, _jsx(Card, { children: plans.length === 0 ? (_jsxs("div", { className: "p-10 text-center text-muted-foreground", children: [_jsx(Calendar, { size: 40, className: "mx-auto mb-3 opacity-60" }), "No plans yet."] })) : (_jsx(DataTable, { data: plans, columns: columns, onRowClick: (row) => router.push(`/marketing/plans/${row?.id}`) })) }), _jsx(Modal, { open: showCreate, onClose: () => setShowCreate(false), title: "New plan", children: _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Title *" }), _jsx(Input, { value: newTitle, onChange: setNewTitle, placeholder: "e.g. Winter campaign" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Budget" }), _jsx(Input, { value: newBudget, onChange: setNewBudget, placeholder: "0" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Plan type" }), _jsxs("select", { value: newTypeId, onChange: (e) => setNewTypeId(e.target.value), className: "w-full border rounded px-2 py-2 bg-background text-sm", children: [_jsx("option", { value: "", children: "\u2014" }), types.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setShowCreate(false), disabled: creating, children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: createPlan, disabled: creating || !newTitle.trim(), children: creating ? 'Creating…' : 'Create' })] })] }) })] }));
}
export default PlansList;
