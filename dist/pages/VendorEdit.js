'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { useFormSubmit } from '@hit/ui-kit/hooks/useFormSubmit';
import { Package, Store } from 'lucide-react';
const VENDOR_KINDS = ['Platform', 'Agency', 'Creator', 'Other'];
export function VendorEdit({ id, onNavigate }) {
    const vendorId = id === 'new' ? undefined : id;
    const router = useRouter();
    const { Page, Card, Input, Button, Select, Spinner, TextArea, Alert, Checkbox } = useUi();
    const { submitting, error, fieldErrors, submit, clearError, setFieldErrors, clearFieldError } = useFormSubmit();
    const [loading, setLoading] = useState(!!vendorId);
    const [vendor, setVendor] = useState(null);
    // Form state
    const [name, setName] = useState('');
    const [kind, setKind] = useState('Platform');
    const [contact, setContact] = useState('');
    const [link, setLink] = useState('');
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);
    const navigate = useCallback((path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else {
            router.push(path);
        }
    }, [onNavigate, router]);
    // Fetch vendor
    useEffect(() => {
        const fetchData = async () => {
            if (!vendorId) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(vendorId)}`);
                if (res.ok) {
                    const data = await res.json();
                    setVendor(data);
                    setName(data.name || '');
                    setKind(data.kind || 'Platform');
                    setContact(data.contact || '');
                    setLink(data.link || '');
                    setNotes(data.notes || '');
                    setIsActive(data.isActive !== false);
                }
            }
            catch (e) {
                console.error('Failed to load vendor:', e);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [vendorId]);
    const validateForm = () => {
        const errors = {};
        if (!name.trim()) {
            errors.name = 'Name is required';
        }
        if (!kind) {
            errors.kind = 'Kind is required';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        const data = {
            name: name.trim(),
            kind,
            contact: contact || null,
            link: link || null,
            notes: notes || null,
            isActive,
        };
        const result = await submit(async () => {
            if (vendorId) {
                const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(vendorId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j?.error || 'Failed to update vendor');
                }
                return { id: vendorId };
            }
            else {
                const res = await fetch('/api/marketing/vendors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j?.error || 'Failed to create vendor');
                }
                return await res.json();
            }
        });
        if (result && typeof result === 'object' && 'id' in result) {
            navigate(`/marketing/vendors/${result.id}`);
        }
    };
    if (loading) {
        return (_jsx(Page, { title: "Vendor", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    const breadcrumbs = [
        { label: 'Marketing', href: '/marketing', icon: _jsx(Package, { size: 14 }) },
        { label: 'Vendors', href: '/marketing/vendors', icon: _jsx(Store, { size: 14 }) },
        ...(vendorId && vendor ? [{ label: vendor.name, href: `/marketing/vendors/${vendorId}` }] : []),
        { label: vendorId ? 'Edit' : 'New' },
    ];
    return (_jsx(Page, { title: vendorId ? 'Edit Vendor' : 'New Vendor', breadcrumbs: breadcrumbs, onNavigate: navigate, children: _jsx(Card, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 p-6", children: [error && (_jsx(Alert, { variant: "error", title: "Error", onClose: clearError, children: error.message })), _jsx(Input, { label: "Name", value: name, onChange: (v) => { setName(v); clearFieldError('name'); }, required: true, error: fieldErrors.name, placeholder: "e.g. Meta Ads" }), _jsx(Select, { label: "Kind", options: VENDOR_KINDS.map((k) => ({ value: k, label: k })), value: kind, onChange: (v) => { setKind(v); clearFieldError('kind'); }, required: true, error: fieldErrors.kind }), _jsx(Input, { label: "Contact", value: contact, onChange: setContact, placeholder: "e.g. john@example.com" }), _jsx(Input, { label: "Link", value: link, onChange: setLink, placeholder: "https://..." }), _jsx(TextArea, { label: "Notes", value: notes, onChange: setNotes, rows: 4, placeholder: "Optional notes..." }), vendorId && (_jsx(Checkbox, { label: "Active", checked: isActive, onChange: setIsActive })), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate(vendorId ? `/marketing/vendors/${vendorId}` : '/marketing/vendors'), disabled: submitting, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: submitting, children: submitting ? 'Saving...' : `${vendorId ? 'Update' : 'Create'} Vendor` })] })] }) }) }));
}
export default VendorEdit;
