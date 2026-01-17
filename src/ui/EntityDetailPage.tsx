'use client';

import React, { useMemo, useState } from 'react';
import type { BreadcrumbItem } from '@hit/ui-kit';
import { useUi } from '@hit/ui-kit';
import { useAlertDialog } from '@hit/ui-kit/hooks/useAlertDialog';
import { Trash2 } from 'lucide-react';
import { useEntityUiSpec } from './useHitUiSpecs';
import { useEntityDataSource } from './entityDataSources';
import { EntityDetailBody } from './EntityDetailBody';

function getDisplayValue(record: any, meta: any, entityKey: string): string {
  const field = String(meta?.displayField || '').trim();
  const raw = field ? record?.[field] : null;
  const fallback = record?.title ?? record?.name ?? record?.key ?? record?.id ?? meta?.titleSingular ?? entityKey;
  return String(raw ?? fallback ?? '').trim();
}

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const replaceAllCompat = (input: string, search: string, replacement: string) => {
    if (!search) return input;
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

export function EntityDetailPage({
  entityKey,
  id,
  onNavigate,
  useDetailData,
}: {
  entityKey: string;
  id: string;
  onNavigate?: (path: string) => void;
  useDetailData?: (args: { id: string }) => {
    record: any;
    loading: boolean;
    deleteItem?: (id: string) => Promise<any>;
  };
}) {
  const { Page, Spinner, Alert, Button, Modal, AlertDialog } = useUi();
  const alertDialog = useAlertDialog();

  const uiSpec = useEntityUiSpec(entityKey);
  const dataSource = useEntityDataSource(entityKey);
  const effectiveUseDetail = useDetailData || (dataSource?.useDetail as any);
  if (!effectiveUseDetail) {
    return (
      <Alert variant="error" title={`Missing data source for ${entityKey}`}>
        No detail data source is registered for `{entityKey}`. Add it to `src/ui/entityDataSources.tsx` (or pass
        `useDetailData`).
      </Alert>
    );
  }

  const { record, loading, deleteItem } = effectiveUseDetail({ id });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // When using router.push() (via onNavigate), do NOT pre-encode the URL because
  // Next.js handles encoding for dynamic route segments. Pre-encoding causes double-encoding
  // (e.g., @ -> %40 -> %2540). Only encode when using window.location.href directly.
  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  if (!uiSpec) return <Spinner />;
  if (loading) return <Spinner />;
  if (!record) {
    const meta: any = (uiSpec as any)?.meta || {};
    return (
      <Alert variant="error" title={`${String(meta?.titleSingular || 'Record')} not found`}>
        The record you're looking for doesn't exist.
      </Alert>
    );
  }

  const meta: any = (uiSpec as any)?.meta || {};
  const routes = meta?.routes || {};
  const actionsMeta: any = meta?.actions || {};

  const listHref = String(routes.list || '/');
  // Use raw (unencoded) id when onNavigate is provided (router.push), encoded otherwise
  const editHref = (rid: string) => {
    const tpl = String(routes.edit || '/{id}/edit');
    return tpl.replace('{id}', onNavigate ? rid : encodeURIComponent(rid));
  };

  const breadcrumbsBase: BreadcrumbItem[] = Array.isArray(meta?.breadcrumbs)
    ? meta.breadcrumbs
        .filter((b: any) => b && typeof b === 'object' && b.label && b.href)
        .map((b: any) => ({ label: String(b.label), href: String(b.href) }))
    : [];

  const display = getDisplayValue(record, meta, entityKey);

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    return [...breadcrumbsBase, { label: display }];
  }, [breadcrumbsBase, display]);

  const editLabel = String(actionsMeta.editLabel || 'Edit');
  const deleteLabel = String(actionsMeta.deleteLabel || 'Delete');
  const cancelLabel = String(actionsMeta.cancelLabel || 'Cancel');
  const deleteConfirmTitle = String(actionsMeta.deleteConfirmTitle || `Delete ${String(meta?.titleSingular || 'Item')}`);
  const deleteConfirmBodyTpl = String(
    actionsMeta.deleteConfirmBody || 'Are you sure you want to delete "{name}"? This action cannot be undone.'
  );

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteItem(String(record.id));
      navigate(listHref);
    } catch (error: any) {
      console.error('Failed to delete:', error);
      await alertDialog.showAlert(error?.message || 'Failed to delete item', {
        variant: 'error',
        title: 'Delete Failed',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Page
      title={display}
      breadcrumbs={breadcrumbs}
      onNavigate={navigate}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => navigate(editHref(String(record.id)))}>
            {editLabel}
          </Button>
          {deleteItem ? (
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>
              <Trash2 size={16} className="mr-2" />
              {deleteLabel}
            </Button>
          ) : null}
        </div>
      }
    >
      <EntityDetailBody entityKey={entityKey} uiSpec={uiSpec} record={record} navigate={navigate} />

      {showDeleteConfirm && deleteItem && (
        <Modal open={true} onClose={() => setShowDeleteConfirm(false)} title={deleteConfirmTitle}>
          <div style={{ padding: '16px' }}>
            <p style={{ marginBottom: '16px' }}>
              {fillTemplate(deleteConfirmBodyTpl, {
                name: display,
                title: display,
                label: display,
                id: String(record?.id || ''),
              })}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                {cancelLabel}
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : deleteLabel}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <AlertDialog {...alertDialog.props} />
    </Page>
  );
}

export default EntityDetailPage;

