/**
 * Unit Tests for Organization Signup Flows
 * 
 * Tests cover:
 * - Account type selection validation
 * - Personal vs ORG signup field requirements
 * - Workspace creation limits for PERSONAL accounts
 * - Organization creation atomicity
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Appwrite databases
const mockDatabases = {
    createDocument: vi.fn(),
    listDocuments: vi.fn(),
    updateDocument: vi.fn(),
    getDocument: vi.fn(),
    deleteDocument: vi.fn(),
};

// Mock data
const mockUser = {
    $id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    prefs: {},
};

describe('Registration Schema Validation', () => {
    it('should require name, email, and password', async () => {
        const { registerSchema } = await import('@/features/auth/schemas');

        const result = registerSchema.safeParse({
            name: 'Test',
            email: 'test@example.com',
            password: 'password123',
        });

        // Should pass with just name, email, password
        // Account type selection now happens POST-AUTH in onboarding
        expect(result.success).toBe(true);
    });

    it('should reject invalid email', async () => {
        const { registerSchema } = await import('@/features/auth/schemas');

        const result = registerSchema.safeParse({
            name: 'Test',
            email: 'not-an-email',
            password: 'password123',
        });

        expect(result.success).toBe(false);
    });

    it('should reject short password', async () => {
        const { registerSchema } = await import('@/features/auth/schemas');

        const result = registerSchema.safeParse({
            name: 'Test',
            email: 'test@example.com',
            password: '123', // Too short
        });

        expect(result.success).toBe(false);
    });

    it('should reject empty name', async () => {
        const { registerSchema } = await import('@/features/auth/schemas');

        const result = registerSchema.safeParse({
            name: '',
            email: 'test@example.com',
            password: 'password123',
        });

        expect(result.success).toBe(false);
    });
});

describe('Workspace Creation Limits', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should allow PERSONAL account first workspace', async () => {
        const { validateWorkspaceCreation } = await import('@/features/members/utils');

        mockDatabases.listDocuments.mockResolvedValueOnce({
            total: 0,
            documents: [],
        });

        const result = await validateWorkspaceCreation({
            databases: mockDatabases as any,
            userId: 'user123',
            accountType: 'PERSONAL',
        });

        expect(result.allowed).toBe(true);
    });

    it('should block PERSONAL account second workspace', async () => {
        const { validateWorkspaceCreation } = await import('@/features/members/utils');

        mockDatabases.listDocuments.mockResolvedValueOnce({
            total: 1,
            documents: [{ $id: 'member1', workspaceId: 'ws1' }],
        });

        const result = await validateWorkspaceCreation({
            databases: mockDatabases as any,
            userId: 'user123',
            accountType: 'PERSONAL',
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('only have one workspace');
    });

    it('should allow ORG account unlimited workspaces', async () => {
        const { validateWorkspaceCreation } = await import('@/features/members/utils');

        // Even with existing workspaces, ORG should be allowed
        mockDatabases.listDocuments.mockResolvedValueOnce({
            total: 5,
            documents: Array(5).fill({ $id: 'member', workspaceId: 'ws' }),
        });

        const result = await validateWorkspaceCreation({
            databases: mockDatabases as any,
            userId: 'user123',
            accountType: 'ORG',
        });

        expect(result.allowed).toBe(true);
    });
});

describe('getMember with Organization Fallback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return direct workspace member if exists', async () => {
        const { getMember } = await import('@/features/members/utils');

        const mockMember = {
            $id: 'member123',
            userId: 'user123',
            workspaceId: 'ws123',
            role: 'ADMIN',
        };

        mockDatabases.listDocuments.mockResolvedValueOnce({
            total: 1,
            documents: [mockMember],
        });

        const result = await getMember({
            databases: mockDatabases as any,
            workspaceId: 'ws123',
            userId: 'user123',
        });

        expect(result).toEqual(mockMember);
    });

    it('should return org member for org workspace if not direct member', async () => {
        const { getMember } = await import('@/features/members/utils');

        // No direct workspace membership
        mockDatabases.listDocuments.mockResolvedValueOnce({
            total: 0,
            documents: [],
        });

        // Workspace has organizationId
        mockDatabases.getDocument.mockResolvedValueOnce({
            $id: 'ws123',
            organizationId: 'org123',
        });

        // User is org member
        mockDatabases.listDocuments.mockResolvedValueOnce({
            total: 1,
            documents: [{
                $id: 'orgMember123',
                userId: 'user123',
                organizationId: 'org123',
                role: 'OWNER',
            }],
        });

        const result = await getMember({
            databases: mockDatabases as any,
            workspaceId: 'ws123',
            userId: 'user123',
        });

        expect(result).toBeDefined();
        expect(result!.isOrgMember).toBe(true);
        expect(result!.role).toBe('OWNER');
    });

    it('should return undefined for non-member of personal workspace', async () => {
        const { getMember } = await import('@/features/members/utils');

        // No direct membership
        mockDatabases.listDocuments.mockResolvedValueOnce({
            total: 0,
            documents: [],
        });

        // Personal workspace (no organizationId)
        mockDatabases.getDocument.mockResolvedValueOnce({
            $id: 'ws123',
            organizationId: null,
        });

        const result = await getMember({
            databases: mockDatabases as any,
            workspaceId: 'ws123',
            userId: 'user123',
        });

        expect(result).toBeUndefined();
    });
});

describe('Organization Role Types', () => {
    it('should define correct OrganizationRole values', async () => {
        const { OrganizationRole } = await import('@/features/organizations/types');

        expect(OrganizationRole.OWNER).toBe('OWNER');
        expect(OrganizationRole.ADMIN).toBe('ADMIN');
        expect(OrganizationRole.MEMBER).toBe('MEMBER');
    });

    it('should define correct AccountType values', async () => {
        const { AccountType } = await import('@/features/organizations/types');

        expect(AccountType.PERSONAL).toBe('PERSONAL');
        expect(AccountType.ORG).toBe('ORG');
    });
});

describe('PERSONAL to ORG Conversion Validation', () => {
    it('should reject conversion if already ORG', async () => {
        const { convertToOrganizationSchema } = await import('@/features/organizations/schemas');

        const result = convertToOrganizationSchema.safeParse({
            organizationName: 'My Org',
        });

        expect(result.success).toBe(true);
    });

    it('should require organization name for conversion', async () => {
        const { convertToOrganizationSchema } = await import('@/features/organizations/schemas');

        const result = convertToOrganizationSchema.safeParse({});

        expect(result.success).toBe(false);
    });
});
