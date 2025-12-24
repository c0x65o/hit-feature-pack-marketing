'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { List, Plus } from 'lucide-react';
export function ActivityTypesSetup() {
    const { Page, Card, Badge, Spinner, Alert, DataTable, Button, Modal, Input, TextArea } = useUi();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [key, setKey] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('');
    const [icon, setIcon] = useState('');
    const fetchTypes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/marketing/activity-types?activeOnly=false');
            if (!res.ok)
                throw new Error('Failed to fetch activity types');
            const data = await res.json();
            setItems(data.items || []);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load activity types');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);
    const columns = useMemo(() => [
        {
            key: 'name',
            label: 'Name',
            render: (_v, row) => (_jsxs("div", { className: "flex items-center gap-2", children: [row.color ? _jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: row.color } }) : null, _jsx("span", { className: "font-medium", children: row.name })] })),
        },
        { key: 'key', label: 'Key', render: (_v, row) => _jsx("code", { className: "text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded", children: row.key }) },
        { key: 'category', label: 'Category', render: (_v, row) => row.category || '—' },
        { key: 'isActive', label: 'Status', render: (_v, row) => _jsx(Badge, { variant: row.isActive ? 'success' : 'default', children: row.isActive ? 'Active' : 'Inactive' }) },
        { key: 'isSystem', label: 'Type', render: (_v, row) => _jsx(Badge, { variant: row.isSystem ? 'default' : 'secondary', children: row.isSystem ? 'System' : 'Custom' }) },
    ], [Badge]);
    const createType = async () => {
        try {
            setCreating(true);
            setError(null);
            const res = await fetch('/api/marketing/activity-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key,
                    name,
                    category: category || null,
                    description: description || null,
                    color: color || null,
                    icon: icon || null,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || 'Failed to create activity type');
            }
            setShowCreate(false);
            setKey('');
            setName('');
            setCategory('');
            setDescription('');
            setColor('');
            setIcon('');
            await fetchTypes();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create activity type');
        }
        finally {
            setCreating(false);
        }
    };
    if (loading) {
        return (_jsx(Page, { title: "Activity Types", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    return (_jsxs(Page, { title: "Activity Types", actions: _jsxs(Button, { variant: "primary", onClick: () => setShowCreate(true), children: [_jsx(Plus, { size: 16, className: "mr-2" }), " New type"] }), children: [error ? (_jsx(Alert, { variant: "error", title: "Error", children: error })) : null, _jsx(Card, { children: items.length === 0 ? (_jsxs("div", { className: "p-10 text-center text-muted-foreground", children: [_jsx(List, { size: 40, className: "mx-auto mb-3 opacity-60" }), "No activity types yet."] })) : (_jsx(DataTable, { data: items, columns: columns, onRowClick: () => { } })) }), _jsx(Modal, { open: showCreate, onClose: () => setShowCreate(false), title: "New activity type", children: _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Key *" }), _jsx(Input, { value: key, onChange: setKey, placeholder: "e.g. video_drop" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Name *" }), _jsx(Input, { value: name, onChange: setName, placeholder: "Video Drop" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Category" }), _jsx(Input, { value: category, onChange: setCategory, placeholder: "marketing | content | ops" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Color" }), _jsx(Input, { value: color, onChange: setColor, placeholder: "#3b82f6" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Icon" }), _jsx(Input, { value: icon, onChange: setIcon, placeholder: "Lucide icon name (optional)" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Description" }), _jsx(TextArea, { value: description, onChange: setDescription, rows: 3, placeholder: "Optional" })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setShowCreate(false), disabled: creating, children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: createType, disabled: creating || !key.trim() || !name.trim(), children: creating ? 'Creating…' : 'Create' })] })] }) })] }));
}
export default ActivityTypesSetup;
