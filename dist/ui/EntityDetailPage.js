'use client';
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { useAlertDialog } from '@hit/ui-kit/hooks/useAlertDialog';
import { Trash2 } from 'lucide-react';
import { useEntityUiSpec } from './useHitUiSpecs';
import { useEntityDataSource } from './entityDataSources';
import { EntityDetailBody } from './EntityDetailBody';
function getDisplayValue(record, meta, entityKey) {
    const field = String(meta?.displayField || '').trim();
    const raw = field ? record?.[field] : null;
    const fallback = record?.title ?? record?.name ?? record?.key ?? record?.id ?? meta?.titleSingular ?? entityKey;
    return String(raw ?? fallback ?? '').trim();
}
function fillTemplate(tpl, vars) {
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaceAllCompat = (input, search, replacement) => {
        if (!search)
            return input;
        return input.replace(new RegExp(escapeRegExp(search), 'g'), replacement);
    };
    let out = String(tpl || '');
    for (const [k, v] of Object.entries(vars)) {
        out = replaceAllCompat(out, `{${k}}`, v);
    }
    // Also support quoted placeholders used in older specs: "{name}"
    for (const [k, v] of Object.entries(vars)) {
        out = replaceAllCompat(out, `"{${k}}"`, `"${v}"`);
    }
    return out;
}
export function EntityDetailPage({ entityKey, id, onNavigate, useDetailData, }) {
    const { Page, Spinner, Alert, Button, Modal, AlertDialog } = useUi();
    const alertDialog = useAlertDialog();
    const uiSpec = useEntityUiSpec(entityKey);
    const dataSource = useEntityDataSource(entityKey);
    const effectiveUseDetail = useDetailData || dataSource?.useDetail;
    if (!effectiveUseDetail) {
        return (_jsxs(Alert, { variant: "error", title: `Missing data source for ${entityKey}`, children: ["No detail data source is registered for `", entityKey, "`. Add it to `src/ui/entityDataSources.tsx` (or pass `useDetailData`)."] }));
    }
    const { record, loading, deleteItem } = effectiveUseDetail({ id });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = (path) => {
        if (onNavigate)
            onNavigate(path);
        else if (typeof window !== 'undefined')
            window.location.href = path;
    };
    if (!uiSpec)
        return _jsx(Spinner, {});
    if (loading)
        return _jsx(Spinner, {});
    if (!record) {
        const meta = uiSpec?.meta || {};
        return (_jsx(Alert, { variant: "error", title: `${String(meta?.titleSingular || 'Record')} not found`, children: "The record you're looking for doesn't exist." }));
    }
    const meta = uiSpec?.meta || {};
    const routes = meta?.routes || {};
    const actionsMeta = meta?.actions || {};
    const listHref = String(routes.list || '/');
    const editHref = (rid) => String(routes.edit || '/{id}/edit').replace('{id}', encodeURIComponent(rid));
    const breadcrumbsBase = Array.isArray(meta?.breadcrumbs)
        ? meta.breadcrumbs
            .filter((b) => b && typeof b === 'object' && b.label && b.href)
            .map((b) => ({ label: String(b.label), href: String(b.href) }))
        : [];
    const display = getDisplayValue(record, meta, entityKey);
    const breadcrumbs = useMemo(() => {
        return [...breadcrumbsBase, { label: display }];
    }, [breadcrumbsBase, display]);
    const editLabel = String(actionsMeta.editLabel || 'Edit');
    const deleteLabel = String(actionsMeta.deleteLabel || 'Delete');
    const cancelLabel = String(actionsMeta.cancelLabel || 'Cancel');
    const deleteConfirmTitle = String(actionsMeta.deleteConfirmTitle || `Delete ${String(meta?.titleSingular || 'Item')}`);
    const deleteConfirmBodyTpl = String(actionsMeta.deleteConfirmBody || 'Are you sure you want to delete "{name}"? This action cannot be undone.');
    const handleDelete = async () => {
        if (!deleteItem)
            return;
        setIsDeleting(true);
        try {
            await deleteItem(String(record.id));
            navigate(listHref);
        }
        catch (error) {
            console.error('Failed to delete:', error);
            await alertDialog.showAlert(error?.message || 'Failed to delete item', {
                variant: 'error',
                title: 'Delete Failed',
            });
        }
        finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };
    return (_jsxs(Page, { title: display, breadcrumbs: breadcrumbs, onNavigate: navigate, actions: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "primary", onClick: () => navigate(editHref(String(record.id))), children: editLabel }), deleteItem ? (_jsxs(Button, { variant: "danger", onClick: () => setShowDeleteConfirm(true), disabled: isDeleting, children: [_jsx(Trash2, { size: 16, className: "mr-2" }), deleteLabel] })) : null] }), children: [_jsx(EntityDetailBody, { entityKey: entityKey, uiSpec: uiSpec, record: record, navigate: navigate }), showDeleteConfirm && deleteItem && (_jsx(Modal, { open: true, onClose: () => setShowDeleteConfirm(false), title: deleteConfirmTitle, children: _jsxs("div", { style: { padding: '16px' }, children: [_jsx("p", { style: { marginBottom: '16px' }, children: fillTemplate(deleteConfirmBodyTpl, {
                                name: display,
                                title: display,
                                label: display,
                                id: String(record?.id || ''),
                            }) }), _jsxs("div", { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setShowDeleteConfirm(false), disabled: isDeleting, children: cancelLabel }), _jsx(Button, { variant: "danger", onClick: handleDelete, disabled: isDeleting, children: isDeleting ? 'Deleting...' : deleteLabel })] })] }) })), _jsx(AlertDialog, { ...alertDialog.props })] }));
}
export default EntityDetailPage;
