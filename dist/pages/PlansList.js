'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { useServerDataTableState } from '@hit/ui-kit';
import { Calendar, Plus } from 'lucide-react';
function formatUsd(n) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}
export function PlansList({ onNavigate }) {
    const router = useRouter();
    const { Page, Card, Button, Badge, DataTable, Alert } = useUi();
    const [plans, setPlans] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const serverTable = useServerDataTableState({
        tableId: 'marketing.plans',
        pageSize: 25,
        initialSort: { sortBy: 'createdAt', sortOrder: 'desc' },
        sortWhitelist: ['title', 'createdAt', 'updatedAt', 'budgetAmount', 'isArchived'],
    });
    const navigate = useCallback((path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else {
            router.push(path);
        }
    }, [onNavigate, router]);
    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            params.set('limit', String(serverTable.query.pageSize));
            params.set('offset', String((serverTable.query.page - 1) * serverTable.query.pageSize));
            if (serverTable.query.search)
                params.set('search', serverTable.query.search);
            if (serverTable.query.sortBy)
                params.set('sortBy', serverTable.query.sortBy);
            if (serverTable.query.sortOrder)
                params.set('sortOrder', serverTable.query.sortOrder);
            const res = await fetch(`/api/marketing/plans?${params.toString()}`);
            if (!res.ok)
                throw new Error('Failed to fetch plans');
            const plansData = await res.json();
            setPlans(plansData.items || []);
            setTotal(Number(plansData.total || 0));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        }
        finally {
            setLoading(false);
        }
    }, [
        serverTable.query.page,
        serverTable.query.pageSize,
        serverTable.query.search,
        serverTable.query.sortBy,
        serverTable.query.sortOrder,
    ]);
    useEffect(() => {
        fetchAll();
    }, [fetchAll]);
    const columns = useMemo(() => [
        {
            key: 'title',
            label: 'Title',
            sortable: true,
            render: (_v, row) => (_jsx("span", { className: "text-blue-600 font-medium", children: row.title })),
        },
        {
            key: 'type',
            label: 'Type',
            render: (_v, row) => row.type ? (_jsxs("div", { className: "flex items-center gap-2", children: [row.type.color ? _jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: row.type.color } }) : null, _jsx("span", { className: "text-sm", children: row.type.name })] })) : ('—'),
        },
        { key: 'budgetAmount', label: 'Budget (USD)', sortable: true, render: (_v, row) => _jsx("span", { className: "font-mono", children: formatUsd(row.budgetAmount) }) },
        { key: 'monthSpendAmount', label: 'This Month (USD)', sortable: false, render: (_v, row) => _jsx("span", { className: "font-mono", children: formatUsd(row.monthSpendAmount) }) },
        {
            key: 'isArchived',
            label: 'Status',
            sortable: true,
            render: (_v, row) => _jsx(Badge, { variant: row.isArchived ? 'default' : 'success', children: row.isArchived ? 'Archived' : 'Active' }),
        },
    ], [Badge]);
    return (_jsxs(Page, { title: "Marketing Plans", actions: _jsxs(Button, { variant: "primary", onClick: () => navigate('/marketing/plans/new'), children: [_jsx(Plus, { size: 16, className: "mr-2" }), " New Plan"] }), children: [error ? (_jsx(Alert, { variant: "error", title: "Error", children: error })) : null, _jsx(Card, { children: plans.length === 0 && !loading ? (_jsxs("div", { className: "p-10 text-center text-muted-foreground", children: [_jsx(Calendar, { size: 40, className: "mx-auto mb-3 opacity-60" }), "No plans yet. Create your first marketing plan to get started."] })) : (_jsx(DataTable, { data: plans, columns: columns, loading: loading, searchable: true, exportable: true, showColumnVisibility: true, total: total, ...serverTable.dataTable, onRefresh: fetchAll, refreshing: loading, searchDebounceMs: 400, onRowClick: (row) => navigate(`/marketing/plans/${row.id}`) })) })] }));
}
export default PlansList;
