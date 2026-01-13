'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { DataTableColumn } from '@hit/ui-kit';

export type ListQueryArgs = {
  page: number;
  pageSize: number;
  search?: string;
  filters?: any[];
  filterMode?: 'all' | 'any';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type EntityListResult = {
  data: any;
  loading: boolean;
  refetch: () => Promise<any> | void;
  deleteItem?: (id: string) => Promise<any>;
};

export type EntityDetailResult = {
  record: any;
  loading: boolean;
  deleteItem?: (id: string) => Promise<any>;
};

export type EntityUpsertResult = {
  record: any;
  loading: boolean;
  create: (payload: any) => Promise<any>;
  update: (id: string, payload: any) => Promise<any>;
};

export type OptionSourceConfig = {
  loading?: boolean;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
};

export type EntityFormRegistries = {
  optionSources: Record<string, OptionSourceConfig | undefined>;
  loading?: Record<string, boolean>;
};

export type EntityDataSource = {
  useList?: (args: ListQueryArgs) => EntityListResult;
  useDetail?: (args: { id: string }) => EntityDetailResult;
  useUpsert?: (args: { id?: string }) => EntityUpsertResult;
  useFormRegistries?: () => EntityFormRegistries;
  useListCustomRenderers?: () => Record<string, DataTableColumn['render']>;
};

function formatMoney(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(safe);
  } catch {
    return `$${safe.toFixed(2)}`;
  }
}

function formatDate(value: unknown): string {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

function formatDateTime(value: unknown): string {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function useApiList({
  url,
  args,
  extraParams,
}: {
  url: string;
  args: ListQueryArgs;
  extraParams?: Record<string, string | undefined>;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const q = new URLSearchParams();
      q.set('limit', String(args.pageSize));
      q.set('offset', String((args.page - 1) * args.pageSize));
      if (args.search) q.set('search', args.search);
      if (args.sortBy) q.set('sortBy', args.sortBy);
      if (args.sortOrder) q.set('sortOrder', args.sortOrder);
      for (const [k, v] of Object.entries(extraParams || {})) {
        const s = String(v || '').trim();
        if (s) q.set(k, s);
      }
      const res = await fetch(`${url}?${q.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed (${res.status})`);
      }
      const json = await res.json();
      setData({
        items: json?.items || [],
        pagination: { total: Number(json?.total || 0), limit: Number(json?.limit || 0), offset: Number(json?.offset || 0) },
        totals: json?.totals,
      });
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e?.message || 'Unknown error'));
      setData({ items: [], pagination: { total: 0 } });
    } finally {
      setLoading(false);
    }
  }, [url, args.page, args.pageSize, args.search, args.sortBy, args.sortOrder, extraParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

function useApiDetail({ url, id }: { url: string; id: string }) {
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOne = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${url}/${encodeURIComponent(id)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed (${res.status})`);
      }
      setRecord(await res.json());
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e?.message || 'Unknown error'));
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [url, id]);

  useEffect(() => {
    if (!id) return;
    fetchOne();
  }, [fetchOne, id]);

  return { record, loading, error, refetch: fetchOne };
}

function useMarketingOptionSources() {
  const [planTypes, setPlanTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [activityTypes, setActivityTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [plans, setPlans] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState({ planTypes: true, activityTypes: true, vendors: true, plans: true });

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        setLoading({ planTypes: true, activityTypes: true, vendors: true, plans: true });

        const [pt, at, v, p] = await Promise.all([
          fetch('/api/marketing/plan-types?activeOnly=true&limit=500&offset=0').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/marketing/activity-types?activeOnly=true&limit=500&offset=0').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/marketing/vendors?activeOnly=true&limit=500&offset=0').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/marketing/plans?limit=500&offset=0').then((r) => (r.ok ? r.json() : null)),
        ]);

        if (cancelled) return;
        setPlanTypes(Array.isArray(pt?.items) ? pt.items : []);
        setActivityTypes(Array.isArray(at?.items) ? at.items : []);
        setVendors(Array.isArray(v?.items) ? v.items : []);
        setPlans(Array.isArray(p?.items) ? p.items : []);
      } finally {
        if (!cancelled) setLoading({ planTypes: false, activityTypes: false, vendors: false, plans: false });
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const optionSources = useMemo<Record<string, OptionSourceConfig | undefined>>(() => {
    return {
      'marketing.planTypes': {
        loading: loading.planTypes,
        placeholder: 'Select plan type',
        options: [
          { value: '', label: '— None —' },
          ...planTypes.map((t: any) => ({ value: String(t.id), label: String(t.name || t.id) })),
        ],
      },
      'marketing.activityTypes': {
        loading: loading.activityTypes,
        placeholder: 'Select activity type',
        options: [
          { value: '', label: '— None —' },
          ...activityTypes.map((t: any) => ({ value: String(t.id), label: String(t.name || t.id) })),
        ],
      },
      'marketing.vendors': {
        loading: loading.vendors,
        placeholder: 'Select vendor',
        options: [
          { value: '', label: '— None —' },
          ...vendors.map((t: any) => ({ value: String(t.id), label: String(t.name || t.id) })),
        ],
      },
      'marketing.plans': {
        loading: loading.plans,
        placeholder: 'Select plan',
        options: [
          { value: '', label: '— None —' },
          ...plans.map((t: any) => ({ value: String(t.id), label: String(t.title || t.id) })),
        ],
      },
    };
  }, [activityTypes, planTypes, vendors, plans, loading]);

  return { optionSources, loading };
}

export function useEntityDataSource(entityKey: string): EntityDataSource | null {
  const registries = useMarketingOptionSources();

  if (entityKey === 'marketing.plan') {
    return {
      useList: (args) => {
        const { data, loading, refetch } = useApiList({ url: '/api/marketing/plans', args });
        const deleteItem = async (id: string) => {
          const res = await fetch(`/api/marketing/plans/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to delete plan (${res.status})`);
          }
          return res.json();
        };
        return { data, loading, refetch, deleteItem };
      },
      useDetail: ({ id }) => {
        const { record, loading } = useApiDetail({ url: '/api/marketing/plans', id });
        const deleteItem = async (rid: string) => {
          const res = await fetch(`/api/marketing/plans/${encodeURIComponent(rid)}`, { method: 'DELETE' });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to delete plan (${res.status})`);
          }
          return res.json();
        };
        return { record, loading, deleteItem };
      },
      useUpsert: ({ id }) => {
        const { record, loading } = id ? useApiDetail({ url: '/api/marketing/plans', id }) : { record: null, loading: false };
        const create = async (payload: any) => {
          const res = await fetch('/api/marketing/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to create plan (${res.status})`);
          }
          return res.json();
        };
        const update = async (rid: string, payload: any) => {
          const res = await fetch(`/api/marketing/plans/${encodeURIComponent(rid)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to update plan (${res.status})`);
          }
          return res.json();
        };
        return { record, loading, create, update };
      },
      useFormRegistries: () => ({ optionSources: registries.optionSources, loading: registries.loading }),
      useListCustomRenderers: () => ({
        budgetAmount: (v) => formatMoney(v),
        monthSpendAmount: (v) => formatMoney(v),
        actualSpendAmount: (v) => formatMoney(v),
        remainingAmount: (v) => formatMoney(v),
        startDate: (v) => formatDate(v),
        endDate: (v) => formatDate(v),
        createdAt: (v) => formatDateTime(v),
        updatedAt: (v) => formatDateTime(v),
        isArchived: (_: unknown, row: Record<string, unknown>) => {
          const isArchived = Boolean((row as any).isArchived);
          return isArchived ? 'Archived' : 'Active';
        },
      }),
    };
  }

  if (entityKey === 'marketing.expense') {
    return {
      useList: (args) => {
        const { data, loading, refetch } = useApiList({
          url: '/api/marketing/expenses',
          args,
          extraParams: { includeTotals: 'false' },
        });
        const deleteItem = async (id: string) => {
          const res = await fetch(`/api/marketing/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to delete expense (${res.status})`);
          }
          return res.json();
        };
        return { data, loading, refetch, deleteItem };
      },
      useDetail: ({ id }) => {
        const { record, loading } = useApiDetail({ url: '/api/marketing/expenses', id });
        const deleteItem = async (rid: string) => {
          const res = await fetch(`/api/marketing/expenses/${encodeURIComponent(rid)}`, { method: 'DELETE' });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to delete expense (${res.status})`);
          }
          return res.json();
        };
        return { record, loading, deleteItem };
      },
      useUpsert: ({ id }) => {
        const { record, loading } = id ? useApiDetail({ url: '/api/marketing/expenses', id }) : { record: null, loading: false };
        const create = async (payload: any) => {
          const res = await fetch('/api/marketing/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to create expense (${res.status})`);
          }
          return res.json();
        };
        const update = async (rid: string, payload: any) => {
          const res = await fetch(`/api/marketing/expenses/${encodeURIComponent(rid)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to update expense (${res.status})`);
          }
          return res.json();
        };
        return { record, loading, create, update };
      },
      useFormRegistries: () => ({ optionSources: registries.optionSources, loading: registries.loading }),
      useListCustomRenderers: () => ({
        occurredAt: (v) => formatDateTime(v),
        amount: (v) => formatMoney(v),
        createdAt: (v) => formatDateTime(v),
        updatedAt: (v) => formatDateTime(v),
      }),
    };
  }

  if (entityKey === 'marketing.vendor') {
    return {
      useList: (args) => {
        const { data, loading, refetch } = useApiList({
          url: '/api/marketing/vendors',
          args,
          extraParams: { activeOnly: 'false' },
        });
        const deleteItem = async (id: string) => {
          const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to delete vendor (${res.status})`);
          }
          return res.json();
        };
        return { data, loading, refetch, deleteItem };
      },
      useDetail: ({ id }) => {
        const { record, loading } = useApiDetail({ url: '/api/marketing/vendors', id });
        const deleteItem = async (rid: string) => {
          const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(rid)}`, { method: 'DELETE' });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to delete vendor (${res.status})`);
          }
          return res.json();
        };
        return { record, loading, deleteItem };
      },
      useUpsert: ({ id }) => {
        const { record, loading } = id ? useApiDetail({ url: '/api/marketing/vendors', id }) : { record: null, loading: false };
        const create = async (payload: any) => {
          const res = await fetch('/api/marketing/vendors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to create vendor (${res.status})`);
          }
          return res.json();
        };
        const update = async (rid: string, payload: any) => {
          const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(rid)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to update vendor (${res.status})`);
          }
          return res.json();
        };
        return { record, loading, create, update };
      },
      useFormRegistries: () => ({ optionSources: {}, loading: {} }),
      useListCustomRenderers: () => ({
        createdAt: (v) => formatDateTime(v),
        updatedAt: (v) => formatDateTime(v),
        isActive: (_: unknown, row: Record<string, unknown>) => (Boolean((row as any).isActive) ? 'Active' : 'Inactive'),
      }),
    };
  }

  // Setup entities
  if (entityKey === 'marketing.planType') {
    return {
      useList: (args) => {
        const { data, loading, refetch } = useApiList({
          url: '/api/marketing/plan-types',
          args,
          extraParams: { activeOnly: 'false' },
        });
        const deleteItem = async (id: string) => {
          const res = await fetch(`/api/marketing/plan-types/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to delete plan type (${res.status})`);
          }
          return res.json();
        };
        return { data, loading, refetch, deleteItem };
      },
      useDetail: ({ id }) => {
        const { record, loading } = useApiDetail({ url: '/api/marketing/plan-types', id });
        const deleteItem = async (rid: string) => {
          const res = await fetch(`/api/marketing/plan-types/${encodeURIComponent(rid)}`, { method: 'DELETE' });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to delete plan type (${res.status})`);
          }
          return res.json();
        };
        return { record, loading, deleteItem };
      },
      useUpsert: ({ id }) => {
        const { record, loading } = id ? useApiDetail({ url: '/api/marketing/plan-types', id }) : { record: null, loading: false };
        const create = async (payload: any) => {
          const res = await fetch('/api/marketing/plan-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to create plan type (${res.status})`);
          }
          return res.json();
        };
        const update = async (rid: string, payload: any) => {
          const res = await fetch(`/api/marketing/plan-types/${encodeURIComponent(rid)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to update plan type (${res.status})`);
          }
          return res.json();
        };
        return { record, loading, create, update };
      },
      useFormRegistries: () => ({ optionSources: {}, loading: {} }),
      useListCustomRenderers: () => ({
        createdAt: (v) => formatDateTime(v),
        updatedAt: (v) => formatDateTime(v),
        isActive: (_: unknown, row: Record<string, unknown>) => (Boolean((row as any).isActive) ? 'Active' : 'Inactive'),
        isSystem: (_: unknown, row: Record<string, unknown>) => (Boolean((row as any).isSystem) ? 'System' : 'Custom'),
      }),
    };
  }

  if (entityKey === 'marketing.activityType') {
    return {
      useList: (args) => {
        const { data, loading, refetch } = useApiList({
          url: '/api/marketing/activity-types',
          args,
          extraParams: { activeOnly: 'false' },
        });
        const deleteItem = async (id: string) => {
          const res = await fetch(`/api/marketing/activity-types/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to delete activity type (${res.status})`);
          }
          return res.json();
        };
        return { data, loading, refetch, deleteItem };
      },
      useDetail: ({ id }) => {
        const { record, loading } = useApiDetail({ url: '/api/marketing/activity-types', id });
        const deleteItem = async (rid: string) => {
          const res = await fetch(`/api/marketing/activity-types/${encodeURIComponent(rid)}`, { method: 'DELETE' });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to delete activity type (${res.status})`);
          }
          return res.json();
        };
        return { record, loading, deleteItem };
      },
      useUpsert: ({ id }) => {
        const { record, loading } = id ? useApiDetail({ url: '/api/marketing/activity-types', id }) : { record: null, loading: false };
        const create = async (payload: any) => {
          const res = await fetch('/api/marketing/activity-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to create activity type (${res.status})`);
          }
          return res.json();
        };
        const update = async (rid: string, payload: any) => {
          const res = await fetch(`/api/marketing/activity-types/${encodeURIComponent(rid)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to update activity type (${res.status})`);
          }
          return res.json();
        };
        return { record, loading, create, update };
      },
      useFormRegistries: () => ({ optionSources: {}, loading: {} }),
      useListCustomRenderers: () => ({
        createdAt: (v) => formatDateTime(v),
        updatedAt: (v) => formatDateTime(v),
        isActive: (_: unknown, row: Record<string, unknown>) => (Boolean((row as any).isActive) ? 'Active' : 'Inactive'),
        isSystem: (_: unknown, row: Record<string, unknown>) => (Boolean((row as any).isSystem) ? 'System' : 'Custom'),
      }),
    };
  }

  return null;
}

