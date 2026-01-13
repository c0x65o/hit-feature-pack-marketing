'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useServerDataTableState, useUi } from '@hit/ui-kit';
import { useEntityUiSpec } from '../useHitUiSpecs';
import { useEntityDataTableColumns } from '../entityTable';
function readParentField(spec, parent, queryKey) {
    const q = (spec?.query || {});
    const m = q?.[queryKey];
    if (!m || typeof m !== 'object')
        return null;
    const vf = m.valueFrom;
    if (!vf || vf.kind !== 'parentField')
        return null;
    const field = String(vf.field || '').trim();
    if (!field)
        return null;
    const v = parent?.[field];
    const s = v == null ? '' : String(v).trim();
    return s || null;
}
export function MarketingExpensesEmbeddedTable({ spec, parent, navigate, }) {
    const { Card, Button, DataTable, Spinner } = useUi();
    const planId = readParentField(spec, parent, 'planId') || String(parent?.id || '').trim();
    const expenseUiSpec = useEntityUiSpec('marketing.expense');
    const expenseListSpec = expenseUiSpec?.list || null;
    const routes = expenseUiSpec?.meta?.routes || {};
    const tableId = String(spec.tableId || expenseListSpec?.tableId || 'marketing.planExpenses');
    const serverTable = useServerDataTableState({
        tableId,
        pageSize: Number(spec.pageSize || expenseListSpec?.pageSize || 25),
        initialSort: spec.initialSort || expenseListSpec?.initialSort || { sortBy: 'occurredAt', sortOrder: 'desc' },
        sortWhitelist: Array.isArray(spec.sortWhitelist) ? spec.sortWhitelist : expenseListSpec?.sortWhitelist,
    });
    const [data, setData] = React.useState({ items: [], pagination: { total: 0 } });
    const [loading, setLoading] = React.useState(true);
    const fetchData = React.useCallback(async () => {
        if (!planId)
            return;
        setLoading(true);
        try {
            const q = new URLSearchParams();
            q.set('limit', String(serverTable.query.pageSize));
            q.set('offset', String((serverTable.query.page - 1) * serverTable.query.pageSize));
            q.set('planId', planId);
            if (serverTable.query.search)
                q.set('search', serverTable.query.search);
            if (serverTable.query.sortBy)
                q.set('sortBy', serverTable.query.sortBy);
            if (serverTable.query.sortOrder)
                q.set('sortOrder', serverTable.query.sortOrder);
            const res = await fetch(`/api/marketing/expenses?${q.toString()}`);
            const json = res.ok ? await res.json() : null;
            setData({
                items: json?.items || [],
                pagination: { total: Number(json?.total || 0) },
            });
        }
        finally {
            setLoading(false);
        }
    }, [planId, serverTable.query.page, serverTable.query.pageSize, serverTable.query.search, serverTable.query.sortBy, serverTable.query.sortOrder]);
    React.useEffect(() => {
        fetchData();
    }, [fetchData]);
    const effectiveListSpec = useMemo(() => {
        if (Array.isArray(spec.columns) && spec.columns.length > 0) {
            const cols = spec.columns.map((c) => (typeof c === 'string' ? { key: c } : c));
            return { ...(expenseListSpec || {}), columns: cols };
        }
        return expenseListSpec || { columns: [] };
    }, [spec.columns, expenseListSpec]);
    const columns = useEntityDataTableColumns({
        listSpec: effectiveListSpec,
        fieldsMap: expenseUiSpec?.fields || null,
        isMobile: false,
        customRenderers: {
            occurredAt: (v) => {
                if (!v)
                    return '—';
                const d = new Date(String(v));
                return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
            },
            amount: (v) => {
                const n = typeof v === 'number' ? v : Number(v);
                const safe = Number.isFinite(n) ? n : 0;
                return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(safe);
            },
        },
    });
    const title = String(spec.title || 'Expenses');
    const emptyMessage = String(spec.emptyMessage || 'No expenses yet.');
    const createHref = String(spec.createRoute || '').replace('{parent.id}', encodeURIComponent(String(parent?.id ?? '')));
    const detailTpl = String(routes?.detail || '/marketing/expenses/{id}');
    if (!expenseUiSpec)
        return _jsx(Spinner, {});
    return (_jsxs(Card, { className: "mt-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h2", { className: "text-lg font-semibold", children: title }), createHref ? (_jsxs(Button, { variant: "primary", size: "sm", onClick: () => navigate(createHref), children: [_jsx(Plus, { size: 16, className: "mr-2" }), "Add"] })) : null] }), _jsx(DataTable, { columns: columns, data: data?.items || [], loading: loading, emptyMessage: emptyMessage, onRowClick: (row) => {
                    const id = String(row.id || '');
                    if (!id)
                        return;
                    navigate(detailTpl.replace('{id}', encodeURIComponent(id)));
                }, onRefresh: fetchData, refreshing: loading, total: data?.pagination?.total, ...serverTable.dataTable, searchDebounceMs: 400, enableViews: true, showColumnVisibility: true })] }));
}
