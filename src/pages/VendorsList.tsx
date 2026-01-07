'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { useServerDataTableState } from '@hit/ui-kit';
import { Building2, Plus } from 'lucide-react';

type Vendor = {
  id: string;
  name: string;
  kind: string;
  contact: string | null;
  isActive: boolean;
};

export function VendorsList() {
  const { Page, Card, Badge, Spinner, Alert, DataTable, Button, Modal, Input, TextArea } = useUi();
  const [items, setItems] = useState<Vendor[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serverTable = useServerDataTableState({
    tableId: 'marketing.vendors',
    pageSize: 25,
    initialSort: { sortBy: 'name', sortOrder: 'asc' },
    // Server supports search, but only sorts by name today (API orderBy name); keep whitelist minimal.
    sortWhitelist: ['name'],
  });

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('Platform');
  const [contact, setContact] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('activeOnly', 'false');
      params.set('limit', String(serverTable.query.pageSize));
      params.set('offset', String((serverTable.query.page - 1) * serverTable.query.pageSize));
      if (serverTable.query.search) params.set('search', serverTable.query.search);

      const res = await fetch(`/api/marketing/vendors?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch vendors');
      const data = await res.json();
      setItems(data.items || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [serverTable.query.page, serverTable.query.pageSize, serverTable.query.search]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name', render: (_v: unknown, row: Vendor) => <span className="font-medium">{row.name}</span> },
      { key: 'kind', label: 'Kind', render: (_v: unknown, row: Vendor) => <Badge variant="default">{row.kind}</Badge> },
      { key: 'contact', label: 'Contact', render: (_v: unknown, row: Vendor) => row.contact || '—' },
      { key: 'isActive', label: 'Status', render: (_v: unknown, row: Vendor) => <Badge variant={row.isActive ? 'success' : 'default'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    ],
    [Badge]
  );

  const createVendor = async () => {
    try {
      setCreating(true);
      setError(null);
      const res = await fetch('/api/marketing/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          kind,
          contact: contact || null,
          link: link || null,
          notes: notes || null,
          isActive: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to create vendor');
      }
      setShowCreate(false);
      setName('');
      setKind('Platform');
      setContact('');
      setLink('');
      setNotes('');
      await fetchVendors();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create vendor');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Page
      title="Marketing Vendors"
      actions={
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New vendor
        </Button>
      }
    >
      {error ? (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      ) : null}

      <Card>
        {items.length === 0 && !loading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Building2 size={40} className="mx-auto mb-3 opacity-60" />
            No vendors yet.
          </div>
        ) : (
          <DataTable
            data={items}
            columns={columns}
            loading={loading}
            searchable
            exportable
            showColumnVisibility
            total={total}
            {...serverTable.dataTable}
            onRefresh={fetchVendors}
            refreshing={loading}
            searchDebounceMs={400}
            onRowClick={() => {}}
          />
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New vendor">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input value={name} onChange={setName} placeholder="e.g. Meta Ads" />
          </div>
          <div>
            <label className="text-sm font-medium">Kind *</label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full border rounded px-2 py-2 bg-background text-sm">
              {['Platform', 'Agency', 'Creator', 'Other'].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Contact</label>
            <Input value={contact} onChange={setContact} placeholder="Optional" />
          </div>
          <div>
            <label className="text-sm font-medium">Link</label>
            <Input value={link} onChange={setLink} placeholder="https://..." />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <TextArea value={notes} onChange={setNotes} rows={3} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createVendor} disabled={creating || !name.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

export default VendorsList;


