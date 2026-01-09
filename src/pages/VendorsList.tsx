'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { useServerDataTableState } from '@hit/ui-kit/hooks/useServerDataTableState';
import { Building2, Plus } from 'lucide-react';

type Vendor = {
  id: string;
  name: string;
  kind: string;
  contact: string | null;
  isActive: boolean;
};

interface VendorsListProps {
  onNavigate?: (path: string) => void;
}

export function VendorsList({ onNavigate }: VendorsListProps) {
  const router = useRouter();
  const { Page, Card, Badge, Alert, DataTable, Button } = useUi();
  const [items, setItems] = useState<Vendor[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serverTable = useServerDataTableState({
    tableId: 'marketing.vendors',
    pageSize: 25,
    initialSort: { sortBy: 'name', sortOrder: 'asc' },
    sortWhitelist: ['name'],
  });

  const navigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  }, [onNavigate, router]);

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
      { key: 'name', label: 'Name', render: (_v: unknown, row: Vendor) => <span className="font-medium text-blue-600">{row.name}</span> },
      { key: 'kind', label: 'Kind', render: (_v: unknown, row: Vendor) => <Badge variant="default">{row.kind}</Badge> },
      { key: 'contact', label: 'Contact', render: (_v: unknown, row: Vendor) => row.contact || '—' },
      { key: 'isActive', label: 'Status', render: (_v: unknown, row: Vendor) => <Badge variant={row.isActive ? 'success' : 'default'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    ],
    [Badge]
  );

  return (
    <Page
      title="Marketing Vendors"
      actions={
        <Button variant="primary" onClick={() => navigate('/marketing/vendors/new')}>
          <Plus size={16} className="mr-2" /> New Vendor
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
            No vendors yet. Add platforms, agencies, or creators you work with.
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
            onRowClick={(row: Vendor) => navigate(`/marketing/vendors/${row.id}`)}
          />
        )}
      </Card>
    </Page>
  );
}

export default VendorsList;
