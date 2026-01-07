'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUi, useAlertDialog, type BreadcrumbItem } from '@hit/ui-kit';
import { Trash2, Pencil, Package, Store, ExternalLink } from 'lucide-react';

type VendorData = {
  id: string;
  name: string;
  kind: string;
  contact: string | null;
  link: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

interface VendorDetailProps {
  id?: string;
  onNavigate?: (path: string) => void;
}

export function VendorDetail({ id, onNavigate }: VendorDetailProps) {
  const router = useRouter();
  const params = useParams();
  const { Page, Card, Button, Badge, Spinner, Alert, Modal, AlertDialog } = useUi();
  const alertDialog = useAlertDialog();

  const vendorId = id || (typeof (params as any)?.id === 'string' ? String((params as any).id) : '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  }, [onNavigate, router]);

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(vendorId)}`);
      if (!res.ok) throw new Error('Failed to fetch vendor');
      const data = await res.json();
      setVendor(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  const handleDelete = async () => {
    if (!vendorId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/marketing/vendors/${encodeURIComponent(vendorId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to delete vendor');
      }
      navigate('/marketing/vendors');
    } catch (e: any) {
      console.error('Failed to delete vendor:', e);
      await alertDialog.showAlert(e?.message || 'Failed to delete vendor', {
        variant: 'error',
        title: 'Delete Failed',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = useMemo(
    () => [
      { label: 'Marketing', href: '/marketing', icon: <Package size={14} /> },
      { label: 'Vendors', href: '/marketing/vendors', icon: <Store size={14} /> },
      { label: vendor?.name || 'Vendor' },
    ],
    [vendor?.name]
  );

  if (loading) {
    return (
      <Page title="Vendor">
        <div className="flex items-center justify-center p-12">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  if (error || !vendor) {
    return (
      <Page title="Vendor">
        <Alert variant="error" title="Error">
          {error || 'Vendor not found'}
        </Alert>
      </Page>
    );
  }

  return (
    <Page
      title={vendor.name}
      breadcrumbs={breadcrumbs}
      onNavigate={navigate}
      actions={
        <div className="flex gap-2 items-center">
          <Badge variant={vendor.isActive ? 'success' : 'default'}>
            {vendor.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button variant="primary" onClick={() => navigate(`/marketing/vendors/${vendorId}/edit`)}>
            <Pencil size={16} className="mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      }
    >
      <Card>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Name</p>
            <p className="text-lg font-semibold">{vendor.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Kind</p>
            <Badge variant="default">{vendor.kind}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Contact</p>
            <p className="text-base">{vendor.contact || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Link</p>
            <p className="text-base">
              {vendor.link ? (
                <a
                  href={vendor.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {vendor.link}
                  <ExternalLink size={14} />
                </a>
              ) : (
                '—'
              )}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p className="text-base whitespace-pre-wrap">{vendor.notes || '—'}</p>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal open={true} onClose={() => setShowDeleteConfirm(false)} title="Delete Vendor">
          <div className="p-4">
            <p className="mb-4">
              Are you sure you want to delete &quot;{vendor.name}&quot;? Expenses linked to this vendor will remain but lose their vendor reference. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <AlertDialog {...alertDialog.props} />
    </Page>
  );
}

export default VendorDetail;
