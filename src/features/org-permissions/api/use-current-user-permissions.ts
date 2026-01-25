"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrent } from "@/features/auth/api/use-current";
import { OrganizationRole } from "@/features/organizations/types";
import { OrgPermissionKey } from "../types";
import { AppRouteKey } from "@/lib/permissions/appRouteKeys";

interface UseCurrentUserOrgPermissionsProps {
    orgId: string;
}

/**
 * Hook to get current user's org permissions
 * 
 * SECURITY: Fetches permissions from server API.
 * - OWNER: Gets all permissions (from server)
 * - Non-owners: Get department-based permissions only
 * - Route Keys: Authoritative navigation items
 * 
 * NOTE: This is for UI rendering only. Server-side checks are authoritative.
 */
export const useCurrentUserOrgPermissions = ({ orgId }: UseCurrentUserOrgPermissionsProps) => {
    const { data: user } = useCurrent();

    const query = useQuery({
        queryKey: ["current-user-org-permissions", orgId, user?.$id],
        queryFn: async (): Promise<{
            permissions: OrgPermissionKey[];
            role: OrganizationRole | null;
            isOwner: boolean;
            orgMemberId: string | null;
            allowedRouteKeys: AppRouteKey[];
        }> => {
            if (!user?.$id || !orgId) {
                return {
                    permissions: [] as OrgPermissionKey[],
                    role: null,
                    isOwner: false,
                    orgMemberId: null,
                    allowedRouteKeys: [],
                };
            }

            // Fetch permissions from server (authoritative source)
            const response = await fetch(
                `/api/user-access?organizationId=${orgId}`,
                { credentials: "include" }
            );

            if (!response.ok) {
                return {
                    permissions: [] as OrgPermissionKey[],
                    role: null,
                    isOwner: false,
                    orgMemberId: null,
                    allowedRouteKeys: [],
                };
            }

            const data = await response.json();

            // Map server response to our interface
            return {
                permissions: (data.permissions || []) as OrgPermissionKey[],
                role: data.role as OrganizationRole | null,
                isOwner: data.isOwner ?? false,
                orgMemberId: data.orgMemberId || null,
                allowedRouteKeys: (data.allowedRouteKeys || []) as AppRouteKey[],
            };
        },
        enabled: !!orgId && !!user?.$id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const hasPermission = (permission: OrgPermissionKey): boolean => {
        // OWNER has all permissions
        if (query.data?.isOwner) return true;
        // Non-owners check department-based permissions from server
        return query.data?.permissions?.includes(permission) ?? false;
    };

    const canAccessRoute = (routeKey: AppRouteKey): boolean => {
        if (query.data?.isOwner) return true;
        return query.data?.allowedRouteKeys?.includes(routeKey) ?? false;
    };

    return {
        ...query,
        hasPermission,
        canAccessRoute,
        isOwner: query.data?.isOwner ?? false,
        role: query.data?.role ?? null,
        allowedRouteKeys: query.data?.allowedRouteKeys ?? [],
    };
};
