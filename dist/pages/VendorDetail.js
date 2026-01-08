'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUi, useAlertDialog } from '@hit/ui-kit';
import { Trash2, Pencil, Package, Store, ExternalLink } from 'lucide-react';
export function VendorDetail({ id, onNavigate }) {
    const router = useRouter();
    const params = useParams();
    const { Page, Card, Button, Badge, Spinner, Alert, Modal, AlertDialog } = useUi();
    const alertDialog = useAlertDialog();
    const vendorId = id || (typeof params?.id === 'string' ? String(params.id) : '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useCallback((path) => {
        if (onNavigate) {
            onNavigate(path);
        }
        else {
            router.push(path);
        }
    }, [onNavigate, router]);
    const fetchVendor = useCallback(async () => {
        if (!vendorId)
            return;
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(vendorId)}`);
            if (!res.ok)
                throw new Error('Failed to fetch vendor');
            const data = await res.json();
            setVendor(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load vendor');
        }
        finally {
            setLoading(false);
        }
    }, [vendorId]);
    useEffect(() => {
        fetchVendor();
    }, [fetchVendor]);
    const handleDelete = async () => {
        if (!vendorId)
            return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(vendorId)}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || 'Failed to delete vendor');
            }
            navigate('/marketing/vendors');
        }
        catch (e) {
            console.error('Failed to delete vendor:', e);
            await alertDialog.showAlert(e?.message || 'Failed to delete vendor', {
                variant: 'error',
                title: 'Delete Failed',
            });
        }
        finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };
    const breadcrumbs = useMemo(() => [
        { label: 'Marketing', href: '/marketing', icon: _jsx(Package, { size: 14 }) },
        { label: 'Vendors', href: '/marketing/vendors', icon: _jsx(Store, { size: 14 }) },
        { label: vendor?.name || 'Vendor' },
    ], [vendor?.name]);
    if (loading) {
        return (_jsx(Page, { title: "Vendor", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    if (error || !vendor) {
        return (_jsx(Page, { title: "Vendor", children: _jsx(Alert, { variant: "error", title: "Error", children: error || 'Vendor not found' }) }));
    }
    return (_jsxs(Page, { title: vendor.name, breadcrumbs: breadcrumbs, onNavigate: navigate, actions: _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx(Badge, { variant: vendor.isActive ? 'success' : 'default', children: vendor.isActive ? 'Active' : 'Inactive' }), _jsxs(Button, { variant: "primary", onClick: () => navigate(`/marketing/vendors/${vendorId}/edit`), children: [_jsx(Pencil, { size: 16, className: "mr-2" }), "Edit"] }), _jsxs(Button, { variant: "danger", onClick: () => setShowDeleteConfirm(true), disabled: isDeleting, children: [_jsx(Trash2, { size: 16, className: "mr-2" }), "Delete"] })] }), children: [_jsx(Card, { children: _jsxs("div", { className: "p-6 grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Name" }), _jsx("p", { className: "text-lg font-semibold", children: vendor.name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Kind" }), _jsx(Badge, { variant: "default", children: vendor.kind })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Contact" }), _jsx("p", { className: "text-base", children: vendor.contact || '—' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Link" }), _jsx("p", { className: "text-base", children: vendor.link ? (_jsxs("a", { href: vendor.link, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:underline inline-flex items-center gap-1", children: [vendor.link, _jsx(ExternalLink, { size: 14 })] })) : ('—') })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Notes" }), _jsx("p", { className: "text-base whitespace-pre-wrap", children: vendor.notes || '—' })] })] }) }), showDeleteConfirm && (_jsx(Modal, { open: true, onClose: () => setShowDeleteConfirm(false), title: "Delete Vendor", children: _jsxs("div", { className: "p-4", children: [_jsxs("p", { className: "mb-4", children: ["Are you sure you want to delete \"", vendor.name, "\"? Expenses linked to this vendor will remain but lose their vendor reference. This action cannot be undone."] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { variant: "secondary", onClick: () => setShowDeleteConfirm(false), children: "Cancel" }), _jsx(Button, { variant: "danger", onClick: handleDelete, disabled: isDeleting, children: isDeleting ? 'Deleting...' : 'Delete' })] })] }) })), _jsx(AlertDialog, { ...alertDialog.props })] }));
}
export default VendorDetail;
