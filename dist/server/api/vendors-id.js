/**
 * Marketing Vendor Detail API
 *
 * GET    - Get vendor
 * PUT    - Update vendor
 * DELETE - Delete vendor
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { marketingVendors } from '@/lib/feature-pack-schemas';
import { eq } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(_request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const [vendor] = await db.select().from(marketingVendors).where(eq(marketingVendors.id, id)).limit(1);
        if (!vendor)
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        return NextResponse.json(vendor);
    }
    catch (error) {
        console.error('Error fetching vendor:', error);
        return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 });
    }
}
export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const [existing] = await db.select({ id: marketingVendors.id }).from(marketingVendors).where(eq(marketingVendors.id, id)).limit(1);
        if (!existing)
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        if (body.kind) {
            const validKinds = ['Platform', 'Agency', 'Creator', 'Other'];
            if (!validKinds.includes(String(body.kind))) {
                return NextResponse.json({ error: `kind must be one of: ${validKinds.join(', ')}` }, { status: 400 });
            }
        }
        const updateData = { updatedAt: new Date() };
        if (body.name !== undefined)
            updateData.name = String(body.name || '').trim();
        if (body.kind !== undefined)
            updateData.kind = String(body.kind || '').trim();
        if (body.link !== undefined)
            updateData.link = body.link || null;
        if (body.contact !== undefined)
            updateData.contact = body.contact || null;
        if (body.notes !== undefined)
            updateData.notes = body.notes || null;
        if (body.isActive !== undefined)
            updateData.isActive = Boolean(body.isActive);
        await db.update(marketingVendors).set(updateData).where(eq(marketingVendors.id, id));
        const [updated] = await db.select().from(marketingVendors).where(eq(marketingVendors.id, id)).limit(1);
        return NextResponse.json(updated);
    }
    catch (error) {
        console.error('Error updating vendor:', error);
        return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
    }
}
export async function DELETE(_request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const [existing] = await db.select({ id: marketingVendors.id }).from(marketingVendors).where(eq(marketingVendors.id, id)).limit(1);
        if (!existing)
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        await db.delete(marketingVendors).where(eq(marketingVendors.id, id));
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting vendor:', error);
        return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
    }
}
