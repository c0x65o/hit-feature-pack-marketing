'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { Building2, Plus } from 'lucide-react';
export function VendorsList() {
    const { Page, Card, Badge, Spinner, Alert, DataTable, Button, Modal, Input, TextArea } = useUi();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const [kind, setKind] = useState('Platform');
    const [contact, setContact] = useState('');
    const [link, setLink] = useState('');
    const [notes, setNotes] = useState('');
    const fetchVendors = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/marketing/vendors?activeOnly=false');
            if (!res.ok)
                throw new Error('Failed to fetch vendors');
            const data = await res.json();
            setItems(data.items || []);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load vendors');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);
    const columns = useMemo(() => [
        { key: 'name', label: 'Name', render: (_v, row) => _jsx("span", { className: "font-medium", children: row.name }) },
        { key: 'kind', label: 'Kind', render: (_v, row) => _jsx(Badge, { variant: "default", children: row.kind }) },
        { key: 'contact', label: 'Contact', render: (_v, row) => row.contact || '—' },
        { key: 'isActive', label: 'Status', render: (_v, row) => _jsx(Badge, { variant: row.isActive ? 'success' : 'default', children: row.isActive ? 'Active' : 'Inactive' }) },
    ], [Badge]);
    const createVendor = async () => {
        try {
            setCreating(true);
            setError(null);
            const res = await fetch('/api/marketing/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    kind,
                    contact: contact || null,
                    link: link || null,
                    notes: notes || null,
                    isActive: true,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || 'Failed to create vendor');
            }
            setShowCreate(false);
            setName('');
            setKind('Platform');
            setContact('');
            setLink('');
            setNotes('');
            await fetchVendors();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create vendor');
        }
        finally {
            setCreating(false);
        }
    };
    if (loading) {
        return (_jsx(Page, { title: "Vendors", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    return (_jsxs(Page, { title: "Marketing Vendors", actions: _jsxs(Button, { variant: "primary", onClick: () => setShowCreate(true), children: [_jsx(Plus, { size: 16, className: "mr-2" }), " New vendor"] }), children: [error ? (_jsx(Alert, { variant: "error", title: "Error", children: error })) : null, _jsx(Card, { children: items.length === 0 ? (_jsxs("div", { className: "p-10 text-center text-muted-foreground", children: [_jsx(Building2, { size: 40, className: "mx-auto mb-3 opacity-60" }), "No vendors yet."] })) : (_jsx(DataTable, { data: items, columns: columns, onRowClick: () => { } })) }), _jsx(Modal, { open: showCreate, onClose: () => setShowCreate(false), title: "New vendor", children: _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Name *" }), _jsx(Input, { value: name, onChange: setName, placeholder: "e.g. Meta Ads" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Kind *" }), _jsx("select", { value: kind, onChange: (e) => setKind(e.target.value), className: "w-full border rounded px-2 py-2 bg-background text-sm", children: ['Platform', 'Agency', 'Creator', 'Other'].map((k) => (_jsx("option", { value: k, children: k }, k))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Contact" }), _jsx(Input, { value: contact, onChange: setContact, placeholder: "Optional" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Link" }), _jsx(Input, { value: link, onChange: setLink, placeholder: "https://..." })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Notes" }), _jsx(TextArea, { value: notes, onChange: setNotes, rows: 3, placeholder: "Optional" })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setShowCreate(false), disabled: creating, children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: createVendor, disabled: creating || !name.trim(), children: creating ? 'Creating…' : 'Create' })] })] }) })] }));
}
export default VendorsList;
