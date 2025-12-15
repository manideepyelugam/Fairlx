"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { SpaceRole, SpacePermission, DEFAULT_SPACE_PERMISSIONS } from "../types";

interface UseSpaceRoleProps {
  spaceId: string;
  workspaceId: string;
}

interface SpaceRoleResult {
  role: SpaceRole | null;
  isMaster: boolean;
  isMember: boolean;
  isViewer: boolean;
  isLoading: boolean;
  hasPermission: (permission: SpacePermission) => boolean;
  canManageTeams: boolean;
  canManageProjects: boolean;
  canManageMembers: boolean;
  canEditSpace: boolean;
}

export const useSpaceRole = ({ spaceId, workspaceId }: UseSpaceRoleProps): SpaceRoleResult => {
  const { data, isLoading } = useQuery({
    queryKey: ["space-role", spaceId, workspaceId],
    queryFn: async () => {
      const response = await client.api.spaces["member-role"].$get({
        query: { spaceId, workspaceId },
      });

      if (!response.ok) {
        return null;
      }

      const json = await response.json();
      return json.data;
    },
    enabled: !!spaceId && !!workspaceId,
  });

  const role = data?.role as SpaceRole | null;
  const permissions = role ? DEFAULT_SPACE_PERMISSIONS[role] : [];

  const hasPermission = (permission: SpacePermission): boolean => {
    return permissions.includes(permission);
  };

  return {
    role,
    isMaster: role === SpaceRole.ADMIN,
    isMember: role === SpaceRole.MEMBER,
    isViewer: role === SpaceRole.VIEWER,
    isLoading,
    hasPermission,
    canManageTeams: hasPermission(SpacePermission.MANAGE_TEAM_SETTINGS) || hasPermission(SpacePermission.CREATE_TEAMS),
    canManageProjects: hasPermission(SpacePermission.MANAGE_PROJECT_SETTINGS) || hasPermission(SpacePermission.CREATE_PROJECTS),
    canManageMembers: hasPermission(SpacePermission.MANAGE_SPACE_MEMBERS),
    canEditSpace: hasPermission(SpacePermission.EDIT_SPACE_SETTINGS),
  };
};
