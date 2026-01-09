'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { useFormSubmit } from '@hit/ui-kit/hooks/useFormSubmit';
import { Package, ClipboardList } from 'lucide-react';
import { useMarketingConfig } from '../hooks/useMarketingConfig';
export function PlanEdit({ id, onNavigate }) {
    const planId = id === 'new' ? undefined : id;
    const router = useRouter();
    const { Page, Card, Input, Button, Select, Spinner, Alert } = useUi();
    const { submitting, error, fieldErrors, submit, clearError, setFieldErrors, clearFieldError } = useFormSubmit();
    const { config: marketingConfig } = useMarketingConfig();
    const linkingEnabled = Boolean(marketingConfig.options.enable_project_linking) && Boolean(marketingConfig.projectsInstalled);
    const linkingRequired = linkingEnabled && Boolean(marketingConfig.options.require_project_linking);
    const [loading, setLoading] = useState(!!planId);
    const [plan, setPlan] = useState(null);
    const [types, setTypes] = useState([]);
    const [projects, setProjects] = useState([]);
    // Form state
    const [title, setTitle] = useState('');
    const [budgetAmount, setBudgetAmount] = useState('0');
    const [typeId, setTypeId] = useState('');
    const [projectId, setProjectId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const navigate = useCallback((path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else {
            router.push(path);
        }
    }, [onNavigate, router]);
    // Fetch plan, types, projects
    useEffect(() => {
        const fetchData = async () => {
            try {
                const typesRes = await fetch('/api/marketing/plan-types?activeOnly=true&limit=500');
                if (typesRes.ok) {
                    const typesData = await typesRes.json();
                    setTypes(typesData.items || []);
                }
                if (linkingEnabled) {
                    const projectsRes = await fetch('/api/projects?page=1&pageSize=500&excludeArchived=true');
                    if (projectsRes.ok) {
                        const j = await projectsRes.json();
                        const data = Array.isArray(j?.data) ? j.data : [];
                        setProjects(data.map((p) => ({ id: String(p.id), name: String(p.name || p.id) })));
                    }
                }
                if (planId) {
                    const planRes = await fetch(`/api/marketing/plans/${encodeURIComponent(planId)}`);
                    if (planRes.ok) {
                        const planData = await planRes.json();
                        setPlan(planData);
                        setTitle(planData.title || '');
                        setBudgetAmount(String(planData.budgetAmount ?? 0));
                        setTypeId(planData.typeId || planData.type?.id || '');
                        setProjectId(planData.projectId || '');
                        setStartDate(planData.startDate ? new Date(planData.startDate).toISOString().slice(0, 10) : '');
                        setEndDate(planData.endDate ? new Date(planData.endDate).toISOString().slice(0, 10) : '');
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
    }, [planId, linkingEnabled]);
    const validateForm = () => {
        const errors = {};
        if (!title.trim()) {
            errors.title = 'Title is required';
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
            title: title.trim(),
            budgetAmount: Number(budgetAmount) || 0,
            typeId: typeId || null,
            startDate: startDate || null,
            endDate: endDate || null,
            // Optional project link (stored server-side via marketing_entity_links)
            projectId: linkingEnabled ? (projectId || null) : undefined,
        };
        const result = await submit(async () => {
            if (planId) {
                const res = await fetch(`/api/marketing/plans/${encodeURIComponent(planId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j?.error || 'Failed to update plan');
                }
                return { id: planId };
            }
            else {
                const res = await fetch('/api/marketing/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j?.error || 'Failed to create plan');
                }
                return await res.json();
            }
        });
        if (result && typeof result === 'object' && 'id' in result) {
            navigate(`/marketing/plans/${result.id}`);
        }
    };
    if (loading) {
        return (_jsx(Page, { title: "Plan", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    const breadcrumbs = [
        { label: 'Marketing', href: '/marketing', icon: _jsx(Package, { size: 14 }) },
        { label: 'Plans', href: '/marketing/plans', icon: _jsx(ClipboardList, { size: 14 }) },
        ...(planId && plan ? [{ label: plan.title, href: `/marketing/plans/${planId}` }] : []),
        { label: planId ? 'Edit' : 'New' },
    ];
    return (_jsx(Page, { title: planId ? 'Edit Plan' : 'New Plan', breadcrumbs: breadcrumbs, onNavigate: navigate, children: _jsx(Card, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 p-6", children: [error && (_jsx(Alert, { variant: "error", title: "Error", onClose: clearError, children: error.message })), _jsx(Input, { label: "Title", value: title, onChange: (v) => {
                            setTitle(v);
                            clearFieldError('title');
                        }, required: true, error: fieldErrors.title, placeholder: "e.g. Q1 Launch Campaign" }), linkingEnabled ? (_jsx(Select, { label: linkingRequired ? 'Project *' : 'Project (optional)', options: [
                            { value: '', label: '— None —' },
                            ...projects.map((p) => ({ value: p.id, label: p.name })),
                        ], value: projectId, onChange: (v) => {
                            setProjectId(v);
                            clearFieldError('projectId');
                        }, required: linkingRequired, error: fieldErrors.projectId })) : null, _jsx(Input, { label: "Budget (USD)", value: budgetAmount, onChange: (v) => {
                            setBudgetAmount(v);
                            clearFieldError('budgetAmount');
                        }, error: fieldErrors.budgetAmount, placeholder: "0" }), _jsx(Select, { label: "Plan Type", options: [{ value: '', label: '— None —' }, ...types.map((t) => ({ value: t.id, label: t.name }))], value: typeId, onChange: (v) => {
                            setTypeId(v);
                            clearFieldError('typeId');
                        } }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(Input, { label: "Start Date", type: "date", value: startDate, onChange: setStartDate }), _jsx(Input, { label: "End Date", type: "date", value: endDate, onChange: setEndDate })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate(planId ? `/marketing/plans/${planId}` : '/marketing/plans'), disabled: submitting, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: submitting, children: submitting ? 'Saving...' : `${planId ? 'Update' : 'Create'} Plan` })] })] }) }) }));
}
export default PlanEdit;
