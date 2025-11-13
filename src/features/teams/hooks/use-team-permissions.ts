import { useMemo } from "react";
import { 
  TeamPermission, 
  TeamMemberRole, 
  DEFAULT_ROLE_PERMISSIONS,
  CustomRole,
  PopulatedTeamMember,
} from "../types";

/**
 * Hook to check if a team member has specific permissions
 * @param member - The team member to check permissions for
 * @param customRoles - List of custom roles (if member has custom role)
 * @returns Object with permission checking utilities
 */
export const useTeamPermissions = (
  member: PopulatedTeamMember | null | undefined,
  customRoles: CustomRole[] = []
) => {
  const permissions = useMemo(() => {
    if (!member) return [];

    // If member has a custom role, get permissions from that role
    if (member.role === TeamMemberRole.CUSTOM && member.customRoleId) {
      const customRole = customRoles.find((r) => r.$id === member.customRoleId);
      return customRole?.permissions || [];
    }

    // Otherwise, use default role permissions
    return DEFAULT_ROLE_PERMISSIONS[member.role] || [];
  }, [member, customRoles]);

  const hasPermission = (permission: TeamPermission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: TeamPermission[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (perms: TeamPermission[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  const isTeamLead = member?.role === TeamMemberRole.LEAD;

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isTeamLead,
    canViewTasks: hasPermission(TeamPermission.VIEW_TASKS),
    canCreateTasks: hasPermission(TeamPermission.CREATE_TASKS),
    canEditTasks: hasPermission(TeamPermission.EDIT_TASKS),
    canDeleteTasks: hasPermission(TeamPermission.DELETE_TASKS),
    canAssignTasks: hasPermission(TeamPermission.ASSIGN_TASKS),
    canViewSprints: hasPermission(TeamPermission.VIEW_SPRINTS),
    canCreateSprints: hasPermission(TeamPermission.CREATE_SPRINTS),
    canEditSprints: hasPermission(TeamPermission.EDIT_SPRINTS),
    canDeleteSprints: hasPermission(TeamPermission.DELETE_SPRINTS),
    canViewMembers: hasPermission(TeamPermission.VIEW_MEMBERS),
    canAddMembers: hasPermission(TeamPermission.ADD_MEMBERS),
    canRemoveMembers: hasPermission(TeamPermission.REMOVE_MEMBERS),
    canChangeRoles: hasPermission(TeamPermission.CHANGE_MEMBER_ROLES),
    canEditSettings: hasPermission(TeamPermission.EDIT_TEAM_SETTINGS),
    canDeleteTeam: hasPermission(TeamPermission.DELETE_TEAM),
    canManageRoles: hasPermission(TeamPermission.MANAGE_ROLES),
    canViewReports: hasPermission(TeamPermission.VIEW_REPORTS),
    canExportData: hasPermission(TeamPermission.EXPORT_DATA),
  };
};

/**
 * Utility function to get permissions for a given role
 * @param role - The team member role
 * @param customRoleId - Optional custom role ID
 * @param customRoles - List of custom roles
 * @returns Array of permissions
 */
export const getPermissionsForRole = (
  role: TeamMemberRole,
  customRoleId?: string,
  customRoles: CustomRole[] = []
): TeamPermission[] => {
  if (role === TeamMemberRole.CUSTOM && customRoleId) {
    const customRole = customRoles.find((r) => r.$id === customRoleId);
    return customRole?.permissions || [];
  }

  return DEFAULT_ROLE_PERMISSIONS[role] || [];
};

/**
 * Utility function to check if user can perform an action
 * @param member - The team member
 * @param permission - The permission to check
 * @param customRoles - List of custom roles
 * @returns Whether the member has the permission
 */
export const checkPermission = (
  member: PopulatedTeamMember | null | undefined,
  permission: TeamPermission,
  customRoles: CustomRole[] = []
): boolean => {
  if (!member) return false;

  const permissions = getPermissionsForRole(
    member.role,
    member.customRoleId,
    customRoles
  );

  return permissions.includes(permission);
};

/**
 * Get role display information
 * @param role - The team member role
 * @param customRoleId - Optional custom role ID
 * @param customRoles - List of custom roles
 * @returns Object with role display properties
 */
export const getRoleDisplay = (
  role: TeamMemberRole,
  customRoleId?: string,
  customRoles: CustomRole[] = []
) => {
  if (role === TeamMemberRole.CUSTOM && customRoleId) {
    const customRole = customRoles.find((r) => r.$id === customRoleId);
    if (customRole) {
      return {
        name: customRole.name,
        color: customRole.color || "blue",
        description: customRole.description,
        isCustom: true,
      };
    }
  }

  const roleNames: Record<TeamMemberRole, string> = {
    [TeamMemberRole.LEAD]: "Team Lead",
    [TeamMemberRole.MEMBER]: "Team Member",
    [TeamMemberRole.CUSTOM]: "Custom Role",
  };

  return {
    name: roleNames[role] || role,
    color: role === TeamMemberRole.LEAD ? "amber" : "secondary",
    description: undefined,
    isCustom: false,
  };
};
