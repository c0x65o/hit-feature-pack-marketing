'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { Plus, Receipt } from 'lucide-react';
function formatUsd(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}
export function ExpensesList() {
    const { Page, Card, Button, Spinner, Alert, DataTable, Modal, Input, TextArea } = useUi();
    const [items, setItems] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [plans, setPlans] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [types, setTypes] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
    const [amount, setAmount] = useState('0');
    const [planId, setPlanId] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [typeId, setTypeId] = useState('');
    const [notes, setNotes] = useState('');
    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [eRes, pRes, vRes, tRes] = await Promise.all([
                fetch('/api/marketing/expenses?limit=500&includeTotals=true'),
                fetch('/api/marketing/plans?limit=500'),
                fetch('/api/marketing/vendors?activeOnly=true'),
                fetch('/api/marketing/activity-types?activeOnly=true'),
            ]);
            if (!eRes.ok)
                throw new Error('Failed to fetch expenses');
            const eData = await eRes.json();
            setItems(eData.items || []);
            setTotalAmount(Number(eData?.totals?.totalAmount || 0));
            if (pRes.ok) {
                const pData = await pRes.json();
                setPlans((pData.items || []).map((p) => ({ id: String(p.id), title: String(p.title) })));
            }
            if (vRes.ok) {
                const vData = await vRes.json();
                setVendors(vData.items || []);
            }
            if (tRes.ok) {
                const tData = await tRes.json();
                setTypes(tData.items || []);
            }
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
        { key: 'occurredAt', label: 'Date', render: (_v, row) => new Date(row.occurredAt).toLocaleDateString() },
        { key: 'plan', label: 'Plan', render: (_v, row) => row.plan?.title || '—' },
        { key: 'vendor', label: 'Vendor', render: (_v, row) => row.vendor?.name || '—' },
        { key: 'type', label: 'Type', render: (_v, row) => row.type?.name || '—' },
        { key: 'amount', label: 'Amount', render: (_v, row) => _jsx("span", { className: "font-mono", children: formatUsd(row.amount) }) },
        { key: 'notes', label: 'Notes', render: (_v, row) => row.notes || '—' },
    ], []);
    const createExpense = async () => {
        try {
            setCreating(true);
            setError(null);
            const res = await fetch('/api/marketing/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    occurredAt,
                    amount: Number(amount || 0),
                    planId: planId || null,
                    vendorId: vendorId || null,
                    typeId: typeId || null,
                    notes: notes || null,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || 'Failed to create expense');
            }
            setShowCreate(false);
            setAmount('0');
            setPlanId('');
            setVendorId('');
            setTypeId('');
            setNotes('');
            setOccurredAt(new Date().toISOString().slice(0, 16));
            await fetchAll();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create expense');
        }
        finally {
            setCreating(false);
        }
    };
    if (loading) {
        return (_jsx(Page, { title: "Expenses", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    return (_jsxs(Page, { title: "Marketing Expenses", actions: _jsxs(Button, { variant: "primary", onClick: () => setShowCreate(true), children: [_jsx(Plus, { size: 16, className: "mr-2" }), " New expense"] }), children: [error ? (_jsx(Alert, { variant: "error", title: "Error", children: error })) : null, _jsxs("div", { className: "mb-3 text-sm text-muted-foreground", children: ["Total (loaded): ", _jsx("span", { className: "font-mono", children: formatUsd(totalAmount) })] }), _jsx(Card, { children: items.length === 0 ? (_jsxs("div", { className: "p-10 text-center text-muted-foreground", children: [_jsx(Receipt, { size: 40, className: "mx-auto mb-3 opacity-60" }), "No expenses yet."] })) : (_jsx(DataTable, { data: items, columns: columns, onRowClick: () => { } })) }), _jsx(Modal, { open: showCreate, onClose: () => setShowCreate(false), title: "New expense", children: _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "When *" }), _jsx(Input, { type: "datetime-local", value: occurredAt, onChange: setOccurredAt })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Amount *" }), _jsx(Input, { value: amount, onChange: setAmount })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Plan" }), _jsxs("select", { value: planId, onChange: (e) => setPlanId(e.target.value), className: "w-full border rounded px-2 py-2 bg-background text-sm", children: [_jsx("option", { value: "", children: "\u2014" }), plans.map((p) => (_jsx("option", { value: p.id, children: p.title }, p.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Vendor" }), _jsxs("select", { value: vendorId, onChange: (e) => setVendorId(e.target.value), className: "w-full border rounded px-2 py-2 bg-background text-sm", children: [_jsx("option", { value: "", children: "\u2014" }), vendors.map((v) => (_jsx("option", { value: v.id, children: v.name }, v.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Activity type" }), _jsxs("select", { value: typeId, onChange: (e) => setTypeId(e.target.value), className: "w-full border rounded px-2 py-2 bg-background text-sm", children: [_jsx("option", { value: "", children: "\u2014" }), types.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Notes" }), _jsx(TextArea, { value: notes, onChange: setNotes, rows: 3, placeholder: "Optional" })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setShowCreate(false), disabled: creating, children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: createExpense, disabled: creating || !occurredAt || Number(amount) <= 0, children: creating ? 'Creating…' : 'Create' })] })] }) })] }));
}
export default ExpensesList;
