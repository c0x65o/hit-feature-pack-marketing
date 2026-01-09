'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { useServerDataTableState } from '@hit/ui-kit/hooks/useServerDataTableState';
import { Plus, Receipt } from 'lucide-react';
function formatUsd(n) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}
export function ExpensesList({ onNavigate }) {
    const router = useRouter();
    const { Page, Card, Button, Alert, DataTable } = useUi();
    const [items, setItems] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const serverTable = useServerDataTableState({
        tableId: 'marketing.expenses',
        pageSize: 25,
        initialSort: { sortBy: 'occurredAt', sortOrder: 'desc' },
        sortWhitelist: ['occurredAt', 'amount', 'createdAt'],
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
            const q = new URLSearchParams();
            q.set('limit', String(serverTable.query.pageSize));
            q.set('offset', String((serverTable.query.page - 1) * serverTable.query.pageSize));
            q.set('includeTotals', 'true');
            if (serverTable.query.search)
                q.set('search', serverTable.query.search);
            if (serverTable.query.sortBy)
                q.set('sortBy', serverTable.query.sortBy);
            if (serverTable.query.sortOrder)
                q.set('sortOrder', serverTable.query.sortOrder);
            const res = await fetch(`/api/marketing/expenses?${q.toString()}`);
            if (!res.ok)
                throw new Error('Failed to fetch expenses');
            const eData = await res.json();
            setItems(eData.items || []);
            setTotalAmount(Number(eData?.totals?.totalAmount || 0));
            setTotal(Number(eData?.total || 0));
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
        { key: 'occurredAt', label: 'Date', sortable: true, render: (_v, row) => new Date(row.occurredAt).toLocaleDateString() },
        { key: 'plan', label: 'Plan', render: (_v, row) => row.plan?.title || '—' },
        { key: 'vendor', label: 'Vendor', render: (_v, row) => row.vendor?.name || '—' },
        { key: 'type', label: 'Type', render: (_v, row) => row.type?.name || '—' },
        { key: 'amount', label: 'Amount (USD)', sortable: true, render: (_v, row) => _jsx("span", { className: "font-mono", children: formatUsd(row.amount) }) },
        { key: 'notes', label: 'Notes', render: (_v, row) => row.notes || '—' },
    ], []);
    return (_jsxs(Page, { title: "Marketing Expenses", actions: _jsxs(Button, { variant: "primary", onClick: () => navigate('/marketing/expenses/new'), children: [_jsx(Plus, { size: 16, className: "mr-2" }), " New Expense"] }), children: [error ? (_jsx(Alert, { variant: "error", title: "Error", children: error })) : null, _jsxs("div", { className: "mb-3 text-sm text-muted-foreground", children: ["Total (filtered): ", _jsx("span", { className: "font-mono", children: formatUsd(totalAmount) })] }), _jsx(Card, { children: items.length === 0 && !loading ? (_jsxs("div", { className: "p-10 text-center text-muted-foreground", children: [_jsx(Receipt, { size: 40, className: "mx-auto mb-3 opacity-60" }), "No expenses yet. Track your marketing spend by adding expenses."] })) : (_jsx(DataTable, { data: items, columns: columns, loading: loading, searchable: true, exportable: true, showColumnVisibility: true, total: total, ...serverTable.dataTable, onRefresh: fetchAll, refreshing: loading, searchDebounceMs: 400, onRowClick: (row) => navigate(`/marketing/expenses/${row.id}`) })) })] }));
}
export default ExpensesList;
