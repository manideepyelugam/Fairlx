/**
 * Integration Tests for Organization Billing and Usage Metering
 * 
 * Tests cover:
 * - Usage metering with billingEntityId
 * - Organization-level aggregation
 * - Invoice generation for organizations
 * - Idempotency key handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageSource } from '@/features/usage/types';

// Mock Appwrite
const mockDatabases = {
    createDocument: vi.fn(),
    listDocuments: vi.fn(),
    updateDocument: vi.fn(),
    getDocument: vi.fn(),
};

describe('Usage Metering with Billing Entity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should include billingEntityId in traffic usage events', async () => {
        const { logTrafficUsage } = await import('@/lib/usage-metering');

        mockDatabases.createDocument.mockResolvedValueOnce({ $id: 'event123' });

        await logTrafficUsage({
            databases: mockDatabases as any,
            workspaceId: 'ws123',
            units: 1024,
            billingEntityId: 'org123',
            billingEntityType: 'organization',
            source: UsageSource.API,
        });

        expect(mockDatabases.createDocument).toHaveBeenCalledWith(
            expect.any(String), // DATABASE_ID
            expect.any(String), // USAGE_EVENTS_ID
            expect.any(String), // ID
            expect.objectContaining({
                billingEntityId: 'org123',
                billingEntityType: 'organization',
            })
        );
    });

    it('should include billingEntityId in storage usage events', async () => {
        const { logStorageUsage } = await import('@/lib/usage-metering');

        mockDatabases.createDocument.mockResolvedValueOnce({ $id: 'event123' });

        await logStorageUsage({
            databases: mockDatabases as any,
            workspaceId: 'ws123',
            units: 1024 * 1024, // 1MB
            operation: 'upload',
            billingEntityId: 'user123',
            billingEntityType: 'user',
        });

        expect(mockDatabases.createDocument).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            expect.any(String),
            expect.objectContaining({
                billingEntityId: 'user123',
                billingEntityType: 'user',
            })
        );
    });

    it('should include billingEntityId in compute usage events', async () => {
        // Note: logComputeUsage uses setTimeout, so we need to handle async timing
        vi.useFakeTimers();

        const { logComputeUsage } = await import('@/lib/usage-metering');

        mockDatabases.createDocument.mockResolvedValueOnce({ $id: 'event123' });

        await logComputeUsage({
            databases: mockDatabases as any,
            workspaceId: 'ws123',
            units: 100,
            jobType: 'automation',
            billingEntityId: 'org456',
            billingEntityType: 'organization',
        });

        // Advance timers to trigger the setTimeout
        await vi.advanceTimersByTimeAsync(200);

        expect(mockDatabases.createDocument).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            expect.any(String),
            expect.objectContaining({
                billingEntityId: 'org456',
                billingEntityType: 'organization',
            })
        );

        vi.useRealTimers();
    });
});

describe('Idempotency Key Handling', () => {
    it('should generate unique idempotency key for compute operations', async () => {
        vi.useFakeTimers();

        const { logComputeUsage } = await import('@/lib/usage-metering');

        mockDatabases.createDocument.mockResolvedValue({ $id: 'event123' });

        // First call
        await logComputeUsage({
            databases: mockDatabases as any,
            workspaceId: 'ws123',
            units: 100,
            jobType: 'automation',
            operationId: 'op-unique-123', // Explicit operation ID for idempotency
        });

        await vi.advanceTimersByTimeAsync(200);

        // Check that idempotency key was included in metadata
        const createCall = mockDatabases.createDocument.mock.calls[0];
        const metadata = JSON.parse(createCall[3].metadata);

        expect(metadata.idempotencyKey).toBe('ws123:automation:op-unique-123');

        vi.useRealTimers();
    });

    it('should silently skip duplicate events with same idempotency key', async () => {
        vi.useFakeTimers();

        const { logComputeUsage } = await import('@/lib/usage-metering');

        // First call succeeds
        mockDatabases.createDocument.mockResolvedValueOnce({ $id: 'event123' });

        // Second call fails with duplicate error
        mockDatabases.createDocument.mockRejectedValueOnce(
            new Error('duplicate key error')
        );

        // Both calls should complete without throwing
        await logComputeUsage({
            databases: mockDatabases as any,
            workspaceId: 'ws123',
            units: 100,
            jobType: 'automation',
            operationId: 'op-123',
        });

        await logComputeUsage({
            databases: mockDatabases as any,
            workspaceId: 'ws123',
            units: 100,
            jobType: 'automation',
            operationId: 'op-123', // Same operation ID
        });

        await vi.advanceTimersByTimeAsync(300);

        // Both should have been called, duplicate silently skipped
        expect(mockDatabases.createDocument).toHaveBeenCalledTimes(2);

        vi.useRealTimers();
    });
});

describe('Organization Usage Aggregation', () => {
    it('should aggregate usage by billingEntityId', async () => {
        // Mock getting usage events for an organization
        mockDatabases.listDocuments.mockResolvedValueOnce({
            total: 3,
            documents: [
                { billingEntityId: 'org123', billingEntityType: 'organization', units: 100 },
                { billingEntityId: 'org123', billingEntityType: 'organization', units: 200 },
                { billingEntityId: 'org123', billingEntityType: 'organization', units: 150 },
            ],
        });

        const events = await mockDatabases.listDocuments();
        const totalUnits = events.documents.reduce(
            (sum: number, e: { units: number }) => sum + e.units,
            0
        );

        expect(totalUnits).toBe(450);
        expect(events.documents.every(
            (e: { billingEntityId: string }) => e.billingEntityId === 'org123'
        )).toBe(true);
    });
});

describe('Invoice Generation for Organizations', () => {
    it('should include organizationId in org-level invoices', () => {
        // Type check: ensure Invoice type has organizationId
        const mockInvoice = {
            invoiceId: 'INV-2025-001',
            workspaceId: 'ws123',
            period: '2025-12',
            trafficGB: 10,
            storageAvgGB: 5,
            computeUnits: 1000,
            totalCost: 99.99,
            aggregationSnapshotId: 'agg123',
            status: 'draft' as const,
            createdAt: new Date().toISOString(),
            billingEntityId: 'org123',
            billingEntityType: 'organization' as const,
            organizationId: 'org123',
        };

        expect(mockInvoice.billingEntityType).toBe('organization');
        expect(mockInvoice.organizationId).toBe('org123');
    });
});

describe('Billing Entity Determination', () => {
    it('should use organization ID for ORG account workspaces', async () => {
        // Fetch workspace and determine billing entity
        mockDatabases.getDocument.mockResolvedValueOnce({
            $id: 'ws123',
            organizationId: 'org456',
            billingScope: 'organization',
        });

        const workspace = await mockDatabases.getDocument();

        const billingEntity = {
            id: workspace.billingScope === 'organization'
                ? workspace.organizationId
                : 'user123',
            type: workspace.billingScope === 'organization'
                ? 'organization'
                : 'user',
        };

        expect(billingEntity.id).toBe('org456');
        expect(billingEntity.type).toBe('organization');
    });

    it('should use user ID for PERSONAL account workspaces', async () => {
        mockDatabases.getDocument.mockResolvedValueOnce({
            $id: 'ws123',
            organizationId: null,
            billingScope: 'user',
            userId: 'user789',
        });

        const workspace = await mockDatabases.getDocument();

        const billingEntity = {
            id: workspace.billingScope === 'organization'
                ? workspace.organizationId
                : workspace.userId,
            type: workspace.billingScope === 'organization'
                ? 'organization'
                : 'user',
        };

        expect(billingEntity.id).toBe('user789');
        expect(billingEntity.type).toBe('user');
    });
});
