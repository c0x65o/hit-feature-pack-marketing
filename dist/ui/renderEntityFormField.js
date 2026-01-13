'use client';
import { jsx as _jsx } from "react/jsx-runtime";
export function renderEntityFormField({ keyName, fieldSpec, value, setValue, error, required, ui, optionSources, }) {
    const type = String(fieldSpec?.type || 'text');
    const label = String(fieldSpec?.label || keyName);
    const disabled = Boolean(fieldSpec?.readOnly);
    if (type === 'boolean') {
        return (_jsx(ui.Checkbox, { label: label, checked: Boolean(value), onChange: (checked) => setValue(Boolean(checked)), disabled: disabled }));
    }
    if (type === 'textarea') {
        return (_jsx(ui.TextArea, { label: label, value: value == null ? '' : String(value), onChange: (v) => setValue(v), disabled: disabled, error: error, required: required, rows: 4 }));
    }
    if (type === 'select') {
        const optionSourceKey = String(fieldSpec?.optionSource || '').trim();
        const inlineOptionsAny = Array.isArray(fieldSpec?.options) ? fieldSpec.options : null;
        const source = optionSourceKey ? optionSources?.[optionSourceKey] : undefined;
        const options = inlineOptionsAny
            ? inlineOptionsAny.map((o) => ({ value: String(o?.value ?? ''), label: String(o?.label ?? o?.value ?? '') }))
            : (source?.options || []);
        const placeholder = String(fieldSpec?.placeholder || '') ||
            String(source?.placeholder || '') ||
            'Select...';
        return (_jsx(ui.Select, { label: label, value: value == null ? '' : String(value), onChange: (v) => setValue(v), options: options, placeholder: placeholder, disabled: disabled || Boolean(source?.loading), error: error, required: required }));
    }
    if (type === 'date') {
        const v = value ? String(value).slice(0, 10) : '';
        return (_jsx(ui.Input, { label: label, type: "date", value: v, onChange: (next) => setValue(next || null), disabled: disabled, error: error, required: required }));
    }
    if (type === 'datetime') {
        // Expect ISO string; input wants YYYY-MM-DDTHH:mm
        const v = value ? new Date(String(value)).toISOString().slice(0, 16) : '';
        return (_jsx(ui.Input, { label: label, type: "datetime-local", value: v, onChange: (next) => setValue(next || null), disabled: disabled, error: error, required: required }));
    }
    if (type === 'number') {
        return (_jsx(ui.Input, { label: label, type: "number", value: value == null ? '' : String(value), onChange: (next) => setValue(next === '' ? null : Number(next)), disabled: disabled, error: error, required: required, placeholder: fieldSpec?.placeholder }));
    }
    if (type === 'secret') {
        return (_jsx(ui.Input, { label: label, type: "password", value: value == null ? '' : String(value), onChange: (next) => setValue(next), disabled: disabled, error: error, required: required, placeholder: fieldSpec?.placeholder }));
    }
    // Default: text
    return (_jsx(ui.Input, { label: label, value: value == null ? '' : String(value), onChange: (next) => setValue(next), disabled: disabled, error: error, required: required, placeholder: fieldSpec?.placeholder }));
}
