'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { useServerDataTableState } from '@hit/ui-kit/hooks/useServerDataTableState';
import { Building2, Plus } from 'lucide-react';
export function VendorsList({ onNavigate }) {
    const router = useRouter();
    const { Page, Card, Badge, Alert, DataTable, Button } = useUi();
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const serverTable = useServerDataTableState({
        tableId: 'marketing.vendors',
        pageSize: 25,
        initialSort: { sortBy: 'name', sortOrder: 'asc' },
        sortWhitelist: ['name'],
    });
    const navigate = useCallback((path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else {
            router.push(path);
        }
    }, [onNavigate, router]);
    const fetchVendors = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            params.set('activeOnly', 'false');
            params.set('limit', String(serverTable.query.pageSize));
            params.set('offset', String((serverTable.query.page - 1) * serverTable.query.pageSize));
            if (serverTable.query.search)
                params.set('search', serverTable.query.search);
            const res = await fetch(`/api/marketing/vendors?${params.toString()}`);
            if (!res.ok)
                throw new Error('Failed to fetch vendors');
            const data = await res.json();
            setItems(data.items || []);
            setTotal(Number(data.total || 0));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load vendors');
        }
        finally {
            setLoading(false);
        }
    }, [serverTable.query.page, serverTable.query.pageSize, serverTable.query.search]);
    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);
    const columns = useMemo(() => [
        { key: 'name', label: 'Name', render: (_v, row) => _jsx("span", { className: "font-medium text-blue-600", children: row.name }) },
        { key: 'kind', label: 'Kind', render: (_v, row) => _jsx(Badge, { variant: "default", children: row.kind }) },
        { key: 'contact', label: 'Contact', render: (_v, row) => row.contact || '—' },
        { key: 'isActive', label: 'Status', render: (_v, row) => _jsx(Badge, { variant: row.isActive ? 'success' : 'default', children: row.isActive ? 'Active' : 'Inactive' }) },
    ], [Badge]);
    return (_jsxs(Page, { title: "Marketing Vendors", actions: _jsxs(Button, { variant: "primary", onClick: () => navigate('/marketing/vendors/new'), children: [_jsx(Plus, { size: 16, className: "mr-2" }), " New Vendor"] }), children: [error ? (_jsx(Alert, { variant: "error", title: "Error", children: error })) : null, _jsx(Card, { children: items.length === 0 && !loading ? (_jsxs("div", { className: "p-10 text-center text-muted-foreground", children: [_jsx(Building2, { size: 40, className: "mx-auto mb-3 opacity-60" }), "No vendors yet. Add platforms, agencies, or creators you work with."] })) : (_jsx(DataTable, { data: items, columns: columns, loading: loading, searchable: true, exportable: true, showColumnVisibility: true, total: total, ...serverTable.dataTable, onRefresh: fetchVendors, refreshing: loading, searchDebounceMs: 400, onRowClick: (row) => navigate(`/marketing/vendors/${row.id}`) })) })] }));
}
export default VendorsList;
