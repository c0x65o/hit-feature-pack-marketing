'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { List, Plus } from 'lucide-react';

type ActivityType = {
  id: string;
  key: string;
  name: string;
  category: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  isSystem: boolean;
  isActive: boolean;
};

export function ActivityTypesSetup() {
  const { Page, Card, Badge, Spinner, Alert, DataTable, Button, Modal, Input, TextArea } = useUi();
  const [items, setItems] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [icon, setIcon] = useState('');

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/marketing/activity-types?activeOnly=false');
      if (!res.ok) throw new Error('Failed to fetch activity types');
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        render: (_v: unknown, row: ActivityType) => (
          <div className="flex items-center gap-2">
            {row.color ? <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }} /> : null}
            <span className="font-medium">{row.name}</span>
          </div>
        ),
      },
      { key: 'key', label: 'Key', render: (_v: unknown, row: ActivityType) => <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{row.key}</code> },
      { key: 'category', label: 'Category', render: (_v: unknown, row: ActivityType) => row.category || '—' },
      { key: 'isActive', label: 'Status', render: (_v: unknown, row: ActivityType) => <Badge variant={row.isActive ? 'success' : 'default'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
      { key: 'isSystem', label: 'Type', render: (_v: unknown, row: ActivityType) => <Badge variant={row.isSystem ? 'default' : 'secondary'}>{row.isSystem ? 'System' : 'Custom'}</Badge> },
    ],
    [Badge]
  );

  const createType = async () => {
    try {
      setCreating(true);
      setError(null);
      const res = await fetch('/api/marketing/activity-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          name,
          category: category || null,
          description: description || null,
          color: color || null,
          icon: icon || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to create activity type');
      }
      setShowCreate(false);
      setKey('');
      setName('');
      setCategory('');
      setDescription('');
      setColor('');
      setIcon('');
      await fetchTypes();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create activity type');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Page title="Activity Types">
        <div className="flex items-center justify-center p-12">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Activity Types"
      actions={
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New type
        </Button>
      }
    >
      {error ? (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      ) : null}

      <Card>
        {items.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <List size={40} className="mx-auto mb-3 opacity-60" />
            No activity types yet.
          </div>
        ) : (
          <DataTable data={items} columns={columns} onRowClick={() => {}} />
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New activity type">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium">Key *</label>
            <Input value={key} onChange={setKey} placeholder="e.g. video_drop" />
          </div>
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input value={name} onChange={setName} placeholder="Video Drop" />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <Input value={category} onChange={setCategory} placeholder="marketing | content | ops" />
          </div>
          <div>
            <label className="text-sm font-medium">Color</label>
            <Input value={color} onChange={setColor} placeholder="#3b82f6" />
          </div>
          <div>
            <label className="text-sm font-medium">Icon</label>
            <Input value={icon} onChange={setIcon} placeholder="Lucide icon name (optional)" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <TextArea value={description} onChange={setDescription} rows={3} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createType} disabled={creating || !key.trim() || !name.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

export default ActivityTypesSetup;


