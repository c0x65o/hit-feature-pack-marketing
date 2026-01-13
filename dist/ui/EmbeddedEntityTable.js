'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Alert } from '@hit/ui-kit';
import { MarketingExpensesEmbeddedTable } from './embeddedTables/MarketingExpensesEmbeddedTable';
export function EmbeddedEntityTable({ spec, parent, navigate, }) {
    const entityType = String(spec?.entityType || '').trim();
    if (!entityType) {
        return _jsx(Alert, { variant: "error", title: "Missing embedded table entityType", children: "Invalid embedded table spec." });
    }
    // Registry by entityType (hook-safe: each renderer is its own component).
    if (entityType === 'marketing.expense') {
        return _jsx(MarketingExpensesEmbeddedTable, { spec: spec, parent: parent, navigate: navigate });
    }
    return (_jsxs(Alert, { variant: "warning", title: "Unsupported embedded table", children: ["No embedded table renderer is registered for `", entityType, "` yet."] }));
}
