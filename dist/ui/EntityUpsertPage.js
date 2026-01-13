'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { useFormSubmit } from '@hit/ui-kit/hooks/useFormSubmit';
import { useEntityUiSpec } from './useHitUiSpecs';
import { useEntityDataSource } from './entityDataSources';
import { renderEntityFormField } from './renderEntityFormField';
function asRecord(v) {
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}
function normalizeId(id) {
    const s = String(id || '').trim();
    if (!s)
        return undefined;
    if (s === 'new')
        return undefined;
    return s;
}
function getDisplayValue(record, meta, entityKey) {
    const field = String(meta?.displayField || '').trim();
    const raw = field ? record?.[field] : null;
    const fallback = record?.title ?? record?.name ?? record?.key ?? record?.id ?? meta?.titleSingular ?? entityKey;
    return String(raw ?? fallback ?? '').trim();
}
export function EntityUpsertPage({ entityKey, id, onNavigate, }) {
    const recordId = normalizeId(id);
    const ui = useUi();
    const { Page, Card, Button, Spinner, Alert } = ui;
    const { submitting, error, fieldErrors, submit, clearError, setFieldErrors, clearFieldError } = useFormSubmit();
    const uiSpec = useEntityUiSpec(entityKey);
    const dataSource = useEntityDataSource(entityKey);
    const registries = dataSource?.useFormRegistries ? dataSource.useFormRegistries() : null;
    const optionSources = registries?.optionSources || {};
    const upsert = dataSource?.useUpsert ? dataSource.useUpsert({ id: recordId }) : null;
    const record = upsert?.record || null;
    const loading = Boolean(upsert?.loading) || Boolean(recordId && !record);
    const meta = uiSpec?.meta || {};
    const routes = meta?.routes || {};
    const actionsMeta = meta?.actions || {};
    const listHref = String(routes.list || '/');
    const detailHref = (rid) => String(routes.detail || '/{id}').replace('{id}', encodeURIComponent(rid));
    const navigate = (path) => {
        if (onNavigate)
            onNavigate(path);
        else if (typeof window !== 'undefined')
            window.location.href = path;
    };
    const fieldsSpec = asRecord(uiSpec?.fields);
    const formSpec = asRecord(uiSpec?.form);
    const sections = Array.isArray(formSpec.sections) ? formSpec.sections : [];
    const allFieldKeys = useMemo(() => {
        const out = [];
        for (const s of sections) {
            const fields = Array.isArray(s?.fields) ? s.fields : [];
            for (const f of fields)
                out.push(String(f));
        }
        return Array.from(new Set(out)).filter(Boolean);
    }, [sections]);
    const [values, setValues] = useState({});
    // Initialize from record (edit) or defaults (new)
    useEffect(() => {
        if (!uiSpec)
            return;
        if (recordId && !record)
            return;
        const next = {};
        for (const k of allFieldKeys) {
            const spec = asRecord(fieldsSpec[k]);
            if (spec.virtual)
                continue;
            const raw = record ? record[k] : undefined;
            if (raw !== undefined)
                next[k] = raw;
        }
        setValues((prev) => ({ ...next, ...prev }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uiSpec, recordId, record, allFieldKeys.join('|')]);
    if (!uiSpec)
        return _jsx(Spinner, {});
    if (!dataSource?.useUpsert) {
        return (_jsxs(Alert, { variant: "error", title: `Missing data source for ${entityKey}`, children: ["No upsert data source is registered for `", entityKey, "`. Add it to `src/ui/entityDataSources.tsx`."] }));
    }
    if (loading) {
        return (_jsx(Page, { title: String(meta?.titleSingular || 'Edit'), children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsx(Spinner, { size: "lg" }) }) }));
    }
    const isEdit = Boolean(recordId);
    const pageTitle = isEdit ? String(actionsMeta.editLabel || `Edit ${String(meta?.titleSingular || '')}`) : String(actionsMeta.createLabel || `New ${String(meta?.titleSingular || '')}`);
    const breadcrumbsBase = Array.isArray(meta?.breadcrumbs)
        ? meta.breadcrumbs
            .filter((b) => b && typeof b === 'object' && b.label && b.href)
            .map((b) => ({ label: String(b.label), href: String(b.href) }))
        : [];
    const breadcrumbs = isEdit
        ? [...breadcrumbsBase, { label: getDisplayValue(record, meta, entityKey), href: detailHref(String(recordId)) }, { label: 'Edit' }]
        : [...breadcrumbsBase, { label: 'New' }];
    const validate = () => {
        const errs = {};
        for (const k of allFieldKeys) {
            const spec = asRecord(fieldsSpec[k]);
            if (!spec || spec.virtual)
                continue;
            if (!spec.required)
                continue;
            const v = values[k];
            if (v == null || String(v).trim() === '') {
                errs[k] = `${String(spec.label || k)} is required`;
            }
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };
    const handleSave = async () => {
        if (!validate())
            return;
        const payload = {};
        for (const k of allFieldKeys) {
            const spec = asRecord(fieldsSpec[k]);
            if (!spec || spec.virtual || spec.readOnly)
                continue;
            const t = String(spec.type || 'text');
            const v = values[k];
            if (t === 'select') {
                const s = v == null ? '' : String(v);
                payload[k] = s ? s : null;
                continue;
            }
            if (t === 'number') {
                if (v == null || v === '')
                    payload[k] = null;
                else
                    payload[k] = Number(v);
                continue;
            }
            if (t === 'boolean') {
                payload[k] = Boolean(v);
                continue;
            }
            // date/datetime/text/textarea
            payload[k] = v == null ? null : v;
        }
        const result = await submit(async () => {
            if (isEdit && recordId) {
                return await upsert.update(recordId, payload);
            }
            return await upsert.create(payload);
        });
        const newId = String(result?.id || recordId || '').trim();
        if (newId)
            navigate(detailHref(newId));
        else
            navigate(listHref);
    };
    return (_jsx(Page, { title: pageTitle, breadcrumbs: breadcrumbs, onNavigate: navigate, children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [error ? (_jsx(Alert, { variant: "error", title: "Error", onClose: clearError, children: error.message })) : null, _jsxs("div", { className: "flex flex-col gap-6", children: [sections.map((s) => {
                                const title = String(s?.title || '');
                                const fields = Array.isArray(s?.fields) ? s.fields.map(String) : [];
                                const columns = Number(s?.layout?.columns || 1);
                                return (_jsxs("div", { children: [title ? _jsx("h3", { className: "text-lg font-semibold mb-3", children: title }) : null, _jsx("div", { style: {
                                                display: 'grid',
                                                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                                                gap: 16,
                                            }, children: fields.map((k) => {
                                                const spec = asRecord(fieldsSpec[k]);
                                                if (!spec || spec.virtual)
                                                    return null;
                                                const required = Boolean(spec.required);
                                                return (_jsx("div", { children: renderEntityFormField({
                                                        keyName: k,
                                                        fieldSpec: spec,
                                                        value: values[k],
                                                        setValue: (v) => {
                                                            setValues((prev) => ({ ...prev, [k]: v }));
                                                            clearFieldError(k);
                                                        },
                                                        error: fieldErrors?.[k],
                                                        required,
                                                        ui,
                                                        optionSources,
                                                    }) }, k));
                                            }) })] }, String(s?.id || title || Math.random())));
                            }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-200 dark:border-gray-800", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate(isEdit && recordId ? detailHref(recordId) : listHref), disabled: submitting, children: String(actionsMeta.cancelLabel || 'Cancel') }), _jsx(Button, { type: "button", variant: "primary", onClick: handleSave, disabled: submitting, children: submitting
                                            ? 'Saving...'
                                            : String(isEdit ? actionsMeta.saveUpdateLabel || 'Update' : actionsMeta.saveCreateLabel || 'Create') })] })] })] }) }) }));
}
export default EntityUpsertPage;
