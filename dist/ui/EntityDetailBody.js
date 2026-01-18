'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useUi } from '@hit/ui-kit';
import { splitLinkedEntityTabsExtra, wrapWithLinkedEntityTabsIfConfigured } from '@hit/feature-pack-form-core';
import { EmbeddedEntityTable } from './EmbeddedEntityTable';
import { useEntityDataSource } from './entityDataSources';
function asRecord(v) {
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}
function formatMoney(value) {
    if (value == null || value === '')
        return null;
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n))
        return null;
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
    }
    catch {
        return `$${n.toFixed(2)}`;
    }
}
function formatLocalDate(value) {
    if (value == null || value === '')
        return null;
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime()))
        return null;
    return d.toLocaleDateString();
}
function formatLocalDateTime(value) {
    if (value == null || value === '')
        return null;
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime()))
        return null;
    try {
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    }
    catch {
        return d.toLocaleString();
    }
}
function formatDuration(value, unit) {
    if (value == null || value === '')
        return null;
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n))
        return null;
    const ms = unit === 's' ? n * 1000 : n;
    if (ms === 0)
        return '0s';
    const absMs = Math.abs(ms);
    const sign = ms < 0 ? '-' : '';
    const units = [
        { label: 'd', ms: 86400000 },
        { label: 'h', ms: 3600000 },
        { label: 'm', ms: 60000 },
        { label: 's', ms: 1000 },
        { label: 'ms', ms: 1 },
    ];
    const parts = [];
    let remaining = absMs;
    for (const u of units) {
        if (remaining >= u.ms) {
            const count = Math.floor(remaining / u.ms);
            remaining = remaining % u.ms;
            parts.push(`${count}${u.label}`);
            if (parts.length >= 2)
                break;
        }
    }
    return parts.length > 0 ? sign + parts.join(' ') : '0s';
}
function getDefaultSummaryFields(uiSpec) {
    const fields = asRecord(uiSpec?.fields);
    const keys = Object.keys(fields);
    // Prefer common business fields first
    const preferred = ['title', 'name', 'amount', 'budgetAmount', 'occurredAt', 'vendorName', 'typeName', 'isActive', 'isArchived'];
    const out = [];
    for (const k of preferred)
        if (keys.includes(k))
            out.push(k);
    for (const k of keys)
        if (!out.includes(k))
            out.push(k);
    return out.slice(0, 12);
}
function DetailField({ uiSpec, record, fieldKey, selectOptionsBySource, }) {
    const fieldsMap = asRecord(uiSpec?.fields) || {};
    const spec = asRecord(fieldsMap[fieldKey]) || {};
    const type = String(spec.type || 'text');
    const label = String(spec.label || fieldKey);
    const raw = record?.[fieldKey];
    let value = null;
    if (type === 'boolean') {
        value = raw == null ? null : Boolean(raw) ? 'Yes' : 'No';
    }
    else if (type === 'date') {
        value = formatLocalDate(raw);
    }
    else if (type === 'datetime') {
        value = formatLocalDateTime(raw);
    }
    else if (type === 'number') {
        // If the label hints at USD, format as money.
        if (String(label).toLowerCase().includes('usd') || String(fieldKey).toLowerCase().includes('amount')) {
            value = formatMoney(raw);
        }
        else {
            value = raw == null ? null : String(raw);
        }
    }
    else if (type === 'duration') {
        value = formatDuration(raw, spec.unit);
    }
    else if (type === 'select') {
        const optionSource = String(spec.optionSource || '').trim();
        const opts = optionSource ? selectOptionsBySource[optionSource] : null;
        const rawStr = raw == null ? '' : String(raw);
        value = rawStr ? (opts?.find((o) => o.value === rawStr)?.label || rawStr) : null;
    }
    else {
        value = raw == null ? null : String(raw);
    }
    if (!value)
        return null;
    return (_jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-400 mb-1", children: label }), _jsx("div", { className: "text-base break-words", children: value })] }, fieldKey));
}
export function EntityDetailBody({ entityKey, uiSpec, record, navigate, }) {
    const { Card } = useUi();
    const dataSource = useEntityDataSource(entityKey);
    const registries = dataSource?.useFormRegistries ? dataSource.useFormRegistries() : null;
    const selectOptionsBySource = useMemo(() => {
        const out = {};
        const optionSources = registries?.optionSources || {};
        for (const [k, cfg] of Object.entries(optionSources)) {
            const c = cfg;
            const optsAny = Array.isArray(c?.options) ? c.options : [];
            out[String(k)] = optsAny
                .map((o) => ({ value: String(o?.value ?? ''), label: String(o?.label ?? '') }))
                .filter((o) => o.value);
        }
        return out;
    }, [registries]);
    const detailSpec = asRecord(uiSpec?.detail) || {};
    const { linkedEntityTabs, extras } = splitLinkedEntityTabsExtra(detailSpec.extras);
    const summaryFields = useMemo(() => {
        const explicit = Array.isArray(detailSpec.summaryFields) ? detailSpec.summaryFields.map(String) : null;
        return explicit && explicit.length > 0 ? explicit : getDefaultSummaryFields(uiSpec);
    }, [detailSpec.summaryFields, uiSpec]);
    const inner = (_jsxs(_Fragment, { children: [_jsx(Card, { className: "mb-4", children: _jsxs("div", { className: "p-4", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: String(detailSpec.summaryTitle || 'Details') }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: summaryFields.map((k) => (_jsx(DetailField, { uiSpec: uiSpec, record: record, fieldKey: k, selectOptionsBySource: selectOptionsBySource }, k))) })] }) }), extras
                .filter((x) => x && typeof x === 'object')
                .map((x, idx) => {
                const kind = String(x.kind || '');
                if (kind === 'embeddedTable') {
                    return (_jsx(EmbeddedEntityTable, { spec: x, parent: record, navigate: navigate }, `extra-embedded-${idx}`));
                }
                return null;
            })] }));
    return (_jsx(_Fragment, { children: wrapWithLinkedEntityTabsIfConfigured({
            linkedEntityTabs,
            entityKey,
            record,
            navigate,
            overview: inner,
        }) }));
}
