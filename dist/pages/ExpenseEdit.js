'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUi, useFormSubmit } from '@hit/ui-kit';
import { Package, Receipt } from 'lucide-react';
import { useMarketingConfig } from '../hooks/useMarketingConfig';
function formatUsd(n) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
}
export function ExpenseEdit({ id, onNavigate }) {
    const expenseId = id === 'new' ? undefined : id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const { Page, Card, Input, Button, Select, Spinner, TextArea, Alert } = useUi();
    const { submitting, error, fieldErrors, submit, clearError, setFieldErrors, clearFieldError } = useFormSubmit();
    const { config: marketingConfig } = useMarketingConfig();
    const linkingEnabled = Boolean(marketingConfig.options.enable_project_linking) && Boolean(marketingConfig.projectsInstalled);
    const linkingRequired = linkingEnabled && Boolean(marketingConfig.options.require_project_linking);
    const [loading, setLoading] = useState(!!expenseId);
    const [expense, setExpense] = useState(null);
    // Lookup data
    const [plans, setPlans] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [activityTypes, setActivityTypes] = useState([]);
    const [projects, setProjects] = useState([]);
    // Form state
    const initialPlanId = searchParams?.get('planId') || '';
    const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
    const [amount, setAmount] = useState('0');
    const [planId, setPlanId] = useState(initialPlanId);
    const [vendorId, setVendorId] = useState('');
    const [typeId, setTypeId] = useState('');
    const [projectId, setProjectId] = useState('');
    const [notes, setNotes] = useState('');
    const navigate = useCallback((path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else {
            router.push(path);
        }
    }, [onNavigate, router]);
    // Fetch expense and lookups
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, vendorsRes, typesRes] = await Promise.all([
                    fetch('/api/marketing/plans?limit=500&offset=0'),
                    fetch('/api/marketing/vendors?activeOnly=true&limit=500&offset=0'),
                    fetch('/api/marketing/activity-types?activeOnly=true&limit=500&offset=0'),
                ]);
                if (plansRes.ok) {
                    const d = await plansRes.json();
                    setPlans((d.items || []).map((p) => ({ id: String(p.id), title: String(p.title) })));
                }
                if (vendorsRes.ok) {
                    const d = await vendorsRes.json();
                    setVendors(d.items || []);
                }
                if (typesRes.ok) {
                    const d = await typesRes.json();
                    setActivityTypes(d.items || []);
                }
                if (linkingEnabled) {
                    const projectsRes = await fetch('/api/projects?page=1&pageSize=500&excludeArchived=true');
                    if (projectsRes.ok) {
                        const j = await projectsRes.json();
                        const data = Array.isArray(j?.data) ? j.data : [];
                        setProjects(data.map((p) => ({ id: String(p.id), name: String(p.name || p.id) })));
                    }
                }
                if (expenseId) {
                    const expenseRes = await fetch(`/api/marketing/expenses/${encodeURIComponent(expenseId)}`);
                    if (expenseRes.ok) {
                        const data = await expenseRes.json();
                        setExpense(data);
                        setOccurredAt(data.occurredAt ? new Date(data.occurredAt).toISOString().slice(0, 16) : '');
                        setAmount(String(data.amount ?? 0));
                        setPlanId(data.planId || data.plan?.id || '');
                        setVendorId(data.vendorId || data.vendor?.id || '');
                        setTypeId(data.typeId || data.type?.id || '');
                        setProjectId(data.projectId || '');
                        setNotes(data.notes || '');
                    }
                }
            }
            catch (e) {
                console.error('Failed to load data:', e);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [expenseId, linkingEnabled]);
    const validateForm = () => {
        const errors = {};
        if (!occurredAt) {
            errors.occurredAt = 'Date is required';
        }
        if (Number(amount) <= 0) {
            errors.amount = 'Amount must be greater than 0';
        }
        if (linkingRequired && !projectId) {
            errors.projectId = 'Project is required';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        const data = {
            occurredAt,
            amount: Number(amount) || 0,
            planId: planId || null,
            vendorId: vendorId || null,
            typeId: typeId || null,
            notes: notes || null,
        };
        if (linkingEnabled) {
            data.projectId = projectId || null;
        }
        const result = await submit(async () => {
            if (expenseId) {
                const res = await fetch(`/api/marketing/expenses/${encodeURIComponent(expenseId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j?.error || 'Failed to update expense');
                }
                return { id: expenseId };
            }
            else {
                const res = await fetch('/api/marketing/expenses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j?.error || 'Failed to create expense');
                }
                return await res.json();
            }
        });
        if (result && typeof result === 'object' && 'id' in result) {
            navigate(`/marketing/expenses/${result.id}`);
        }
    };
    if (loading) {
        return (_jsx(Page, { title: "Expense", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    const breadcrumbs = [
        { label: 'Marketing', href: '/marketing', icon: _jsx(Package, { size: 14 }) },
        { label: 'Expenses', href: '/marketing/expenses', icon: _jsx(Receipt, { size: 14 }) },
        ...(expenseId && expense ? [{ label: formatUsd(expense.amount), href: `/marketing/expenses/${expenseId}` }] : []),
        { label: expenseId ? 'Edit' : 'New' },
    ];
    return (_jsx(Page, { title: expenseId ? 'Edit Expense' : 'New Expense', breadcrumbs: breadcrumbs, onNavigate: navigate, children: _jsx(Card, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 p-6", children: [error && (_jsx(Alert, { variant: "error", title: "Error", onClose: clearError, children: error.message })), _jsx(Input, { label: "Date", type: "datetime-local", value: occurredAt, onChange: (v) => {
                            setOccurredAt(v);
                            clearFieldError('occurredAt');
                        }, required: true, error: fieldErrors.occurredAt }), _jsx(Input, { label: "Amount (USD)", value: amount, onChange: (v) => {
                            setAmount(v);
                            clearFieldError('amount');
                        }, required: true, error: fieldErrors.amount, placeholder: "0" }), linkingEnabled ? (_jsx(Select, { label: linkingRequired ? 'Project *' : 'Project (optional)', options: [
                            { value: '', label: '— None —' },
                            ...projects.map((p) => ({ value: p.id, label: p.name })),
                        ], value: projectId, onChange: (v) => {
                            setProjectId(v);
                            clearFieldError('projectId');
                        }, required: linkingRequired, error: fieldErrors.projectId })) : null, _jsx(Select, { label: "Plan", options: [{ value: '', label: '— None —' }, ...plans.map((p) => ({ value: p.id, label: p.title }))], value: planId, onChange: setPlanId }), _jsx(Select, { label: "Vendor", options: [{ value: '', label: '— None —' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))], value: vendorId, onChange: setVendorId }), _jsx(Select, { label: "Activity Type", options: [{ value: '', label: '— None —' }, ...activityTypes.map((t) => ({ value: t.id, label: t.name }))], value: typeId, onChange: setTypeId }), _jsx(TextArea, { label: "Notes", value: notes, onChange: setNotes, rows: 4, placeholder: "Optional notes..." }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate(expenseId ? `/marketing/expenses/${expenseId}` : '/marketing/expenses'), disabled: submitting, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: submitting, children: submitting ? 'Saving...' : `${expenseId ? 'Update' : 'Create'} Expense` })] })] }) }) }));
}
export default ExpenseEdit;
