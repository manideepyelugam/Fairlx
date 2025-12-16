import { useCallback } from "react";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { Member } from "@/features/members/types";

export const usePermission = () => {
    const workspaceId = useWorkspaceId();
    const { data, isLoading } = useCurrentMember({ workspaceId });
    const member = data as (Member & { permissions: string[] }) | undefined;

    const can = useCallback(
        (permission: string) => {
            if (isLoading || !member) return false;
            // permissions are now returned by the API
            return member.permissions?.includes(permission) ?? false;
        },
        [member, isLoading]
    );

    return {
        can,
        isLoading,
        role: member?.role
    };
};