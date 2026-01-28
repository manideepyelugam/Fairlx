import { Query, type Databases } from "node-appwrite";
import { DATABASE_ID, ORGANIZATION_MEMBERS_ID } from "@/config";
import { OrganizationRole } from "@/features/organizations/types";

/**
 * Account Guards
 * 
 * These guards prevent destructive actions that would violate system invariants.
 * Used primarily for account lifecycle operations.
 */

interface CanDeleteAccountProps {
    databases: Databases;
    userId: string;
}

interface CanDeleteAccountResult {
    allowed: boolean;
    reason?: string;
    /** Organizations where user is the sole owner */
    blockingOrganizations?: Array<{ id: string; name: string }>;
}

/**
 * Check if user can delete their account
 * 
 * INVARIANT: An account cannot be deleted if the user is the sole OWNER
 * of any organization. Ownership must be transferred first.
 * 
 * WHY: Organizations represent billing entities and contractual relationships.
 * Orphaned organizations would have no one to manage them or pay bills.
 * 
 * @returns { allowed: boolean, reason?: string, blockingOrganizations?: Array }
 */
export async function canDeleteAccount({
    databases,
    userId,
}: CanDeleteAccountProps): Promise<CanDeleteAccountResult> {
    try {
        // Find all organizations where user is an OWNER
        const ownerships = await databases.listDocuments(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("userId", userId),
                Query.equal("role", OrganizationRole.OWNER),
            ]
        );

        if (ownerships.total === 0) {
            return { allowed: true };
        }

        // For each organization where user is owner, check if they're the sole owner
        const blockingOrganizations: Array<{ id: string; name: string }> = [];

        for (const ownership of ownerships.documents) {
            const orgId = ownership.organizationId;

            // Count total owners in this organization
            const allOwners = await databases.listDocuments(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                [
                    Query.equal("organizationId", orgId),
                    Query.equal("role", OrganizationRole.OWNER),
                ]
            );

            if (allOwners.total <= 1) {
                // User is the sole owner - this org blocks deletion
                // Try to get org name for better error message
                let orgName = orgId;
                try {
                    const org = await databases.getDocument(
                        DATABASE_ID,
                        "organizations",
                        orgId
                    );
                    orgName = org.name || orgId;
                } catch {
                    // Ignore - use ID as fallback
                }

                blockingOrganizations.push({ id: orgId, name: orgName });
            }
        }

        if (blockingOrganizations.length > 0) {
            const orgNames = blockingOrganizations.map((o) => o.name).join(", ");
            return {
                allowed: false,
                reason: `Cannot delete account: You are the sole owner of ${blockingOrganizations.length} organization(s): ${orgNames}. Transfer ownership before deleting your account.`,
                blockingOrganizations,
            };
        }

        return { allowed: true };
    } catch {
        // FAIL CLOSED: If we can't verify, don't allow deletion
        return {
            allowed: false,
            reason: "Unable to verify account deletion eligibility. Please try again.",
        };
    }
}

interface CanLeaveOrganizationProps {
    databases: Databases;
    organizationId: string;
    userId: string;
}

interface CanLeaveOrganizationResult {
    allowed: boolean;
    reason?: string;
}

/**
 * Check if user can leave an organization
 * 
 * INVARIANT: The last OWNER cannot leave without transferring ownership.
 * 
 * @returns { allowed: boolean, reason?: string }
 */
export async function canLeaveOrganization({
    databases,
    organizationId,
    userId,
}: CanLeaveOrganizationProps): Promise<CanLeaveOrganizationResult> {
    try {
        // Check user's role in this organization
        const membership = await databases.listDocuments(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("organizationId", organizationId),
                Query.equal("userId", userId),
            ]
        );

        if (membership.total === 0) {
            return { allowed: false, reason: "Not a member of this organization" };
        }

        const userRole = membership.documents[0].role;

        // Non-owners can always leave
        if (userRole !== OrganizationRole.OWNER) {
            return { allowed: true };
        }

        // User is an owner - check if they're the sole owner
        const allOwners = await databases.listDocuments(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("organizationId", organizationId),
                Query.equal("role", OrganizationRole.OWNER),
            ]
        );

        if (allOwners.total <= 1) {
            return {
                allowed: false,
                reason: "Cannot leave organization: You are the sole owner. Transfer ownership to another member first.",
            };
        }

        return { allowed: true };
    } catch {
        // FAIL CLOSED
        return {
            allowed: false,
            reason: "Unable to verify. Please try again.",
        };
    }
}
