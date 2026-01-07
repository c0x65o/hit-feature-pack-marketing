'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUi, useFormSubmit, type BreadcrumbItem } from '@hit/ui-kit';
import { Package, Store } from 'lucide-react';

type VendorData = {
  id: string;
  name: string;
  kind: string;
  contact: string | null;
  link: string | null;
  notes: string | null;
  isActive: boolean;
};

const VENDOR_KINDS = ['Platform', 'Agency', 'Creator', 'Other'];

interface VendorEditProps {
  id?: string;
  onNavigate?: (path: string) => void;
}

export function VendorEdit({ id, onNavigate }: VendorEditProps) {
  const vendorId = id === 'new' ? undefined : id;
  const router = useRouter();
  const { Page, Card, Input, Button, Select, Spinner, TextArea, Alert, Checkbox } = useUi();
  const { submitting, error, fieldErrors, submit, clearError, setFieldErrors, clearFieldError } = useFormSubmit();

  const [loading, setLoading] = useState(!!vendorId);
  const [vendor, setVendor] = useState<VendorData | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [kind, setKind] = useState('Platform');
  const [contact, setContact] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const navigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  }, [onNavigate, router]);

  // Fetch vendor
  useEffect(() => {
    const fetchData = async () => {
      if (!vendorId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(vendorId)}`);
        if (res.ok) {
          const data = await res.json();
          setVendor(data);
          setName(data.name || '');
          setKind(data.kind || 'Platform');
          setContact(data.contact || '');
          setLink(data.link || '');
          setNotes(data.notes || '');
          setIsActive(data.isActive !== false);
        }
      } catch (e) {
        console.error('Failed to load vendor:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vendorId]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    if (!kind) {
      errors.kind = 'Kind is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      name: name.trim(),
      kind,
      contact: contact || null,
      link: link || null,
      notes: notes || null,
      isActive,
    };

    const result = await submit(async () => {
      if (vendorId) {
        const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(vendorId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Failed to update vendor');
        }
        return { id: vendorId };
      } else {
        const res = await fetch('/api/marketing/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Failed to create vendor');
        }
        return await res.json();
      }
    });

    if (result && typeof result === 'object' && 'id' in result) {
      navigate(`/marketing/vendors/${result.id}`);
    }
  };

  if (loading) {
    return (
      <Page title="Vendor">
        <div className="flex items-center justify-center p-12">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Marketing', href: '/marketing', icon: <Package size={14} /> },
    { label: 'Vendors', href: '/marketing/vendors', icon: <Store size={14} /> },
    ...(vendorId && vendor ? [{ label: vendor.name, href: `/marketing/vendors/${vendorId}` }] : []),
    { label: vendorId ? 'Edit' : 'New' },
  ];

  return (
    <Page
      title={vendorId ? 'Edit Vendor' : 'New Vendor'}
      breadcrumbs={breadcrumbs}
      onNavigate={navigate}
    >
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <Alert variant="error" title="Error" onClose={clearError}>
              {error.message}
            </Alert>
          )}

          <Input
            label="Name"
            value={name}
            onChange={(v: string) => { setName(v); clearFieldError('name'); }}
            required
            error={fieldErrors.name}
            placeholder="e.g. Meta Ads"
          />

          <Select
            label="Kind"
            options={VENDOR_KINDS.map((k) => ({ value: k, label: k }))}
            value={kind}
            onChange={(v: string) => { setKind(v); clearFieldError('kind'); }}
            required
            error={fieldErrors.kind}
          />

          <Input
            label="Contact"
            value={contact}
            onChange={setContact}
            placeholder="e.g. john@example.com"
          />

          <Input
            label="Link"
            value={link}
            onChange={setLink}
            placeholder="https://..."
          />

          <TextArea
            label="Notes"
            value={notes}
            onChange={setNotes}
            rows={4}
            placeholder="Optional notes..."
          />

          {vendorId && (
            <Checkbox
              label="Active"
              checked={isActive}
              onChange={setIsActive}
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(vendorId ? `/marketing/vendors/${vendorId}` : '/marketing/vendors')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : `${vendorId ? 'Update' : 'Create'} Vendor`}
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}

export default VendorEdit;
