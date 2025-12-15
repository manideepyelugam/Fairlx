export const PERMISSIONS = {
    // Workspace
    WORKSPACE_UPDATE: "EDIT_TEAM_SETTINGS",
    WORKSPACE_DELETE: "DELETE_TEAM",

    // Members
    MEMBER_ADD: "ADD_MEMBERS",
    MEMBER_UPDATE: "CHANGE_MEMBER_ROLES",
    MEMBER_DELETE: "REMOVE_MEMBERS",

    // Projects
    PROJECT_CREATE: "EDIT_TEAM_SETTINGS",
    PROJECT_UPDATE: "EDIT_TEAM_SETTINGS",
    PROJECT_DELETE: "DELETE_TEAM",

    // Work Items (Tasks/Issues)
    WORKITEM_CREATE: "CREATE_TASKS",
    WORKITEM_UPDATE: "EDIT_TASKS",
    WORKITEM_DELETE: "DELETE_TASKS",
    WORKITEM_ASSIGN: "ASSIGN_TASKS",
    WORKITEM_TRANSITION: "EDIT_TASKS",

    // Sprints
    SPRINT_CREATE: "CREATE_SPRINTS",
    SPRINT_UPDATE: "EDIT_SPRINTS",
    SPRINT_START: "START_SPRINTS",
    SPRINT_COMPLETE: "COMPLETE_SPRINTS",
    SPRINT_DELETE: "DELETE_SPRINTS",

    // Board
    BOARD_CONFIGURE: "EDIT_TEAM_SETTINGS",

    // Billing
    BILLING_VIEW: "billing:view",
    BILLING_MANAGE: "billing:manage",

    // Reports
    REPORT_EXPORT: "EXPORT_DATA",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLES = {
    OWNER: "OWNER",
    ADMIN: "ADMIN",
    PROJECT_ADMIN: "PROJECT_ADMIN",
    MANAGER: "MANAGER",
    DEVELOPER: "DEVELOPER",
    VIEWER: "VIEWER",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Default Role Permissions (acts as initial seed or fallback)
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [ROLES.OWNER]: Object.values(PERMISSIONS), // Full access
    [ROLES.ADMIN]: Object.values(PERMISSIONS).filter(
        (p) => p !== PERMISSIONS.BILLING_MANAGE && p !== PERMISSIONS.WORKSPACE_DELETE // Admins can do almost everything except delete workspace or manage billing (unless specified)
    ),
    [ROLES.PROJECT_ADMIN]: [
        PERMISSIONS.PROJECT_UPDATE,
        PERMISSIONS.PROJECT_DELETE,
        PERMISSIONS.WORKITEM_CREATE,
        PERMISSIONS.WORKITEM_UPDATE,
        PERMISSIONS.WORKITEM_DELETE,
        PERMISSIONS.WORKITEM_ASSIGN,
        PERMISSIONS.WORKITEM_TRANSITION,
        PERMISSIONS.SPRINT_CREATE,
        PERMISSIONS.SPRINT_START,
        PERMISSIONS.SPRINT_COMPLETE,
        PERMISSIONS.SPRINT_DELETE,
        PERMISSIONS.BOARD_CONFIGURE,
        PERMISSIONS.REPORT_EXPORT,
    ],
    [ROLES.MANAGER]: [
        PERMISSIONS.PROJECT_UPDATE, // Can update settings but not delete
        PERMISSIONS.WORKITEM_CREATE,
        PERMISSIONS.WORKITEM_UPDATE,
        PERMISSIONS.WORKITEM_DELETE,
        PERMISSIONS.WORKITEM_ASSIGN,
        PERMISSIONS.WORKITEM_TRANSITION,
        PERMISSIONS.SPRINT_CREATE, // Planning
        PERMISSIONS.SPRINT_START,
        PERMISSIONS.SPRINT_COMPLETE,
        PERMISSIONS.REPORT_EXPORT,
    ],
    [ROLES.DEVELOPER]: [
        PERMISSIONS.WORKITEM_CREATE,
        PERMISSIONS.WORKITEM_UPDATE, // Can update tasks they are assigned or generally
        PERMISSIONS.WORKITEM_TRANSITION,
        PERMISSIONS.WORKITEM_ASSIGN, // Identify self?
        PERMISSIONS.REPORT_EXPORT,
    ],
    [ROLES.VIEWER]: [
        // Read-only generally implies they have no "action" permissions
        // But they might need some 'view' permissions if we had them.
        // For now, list is empty or minimal specific actions they can take?
        // User requested "read-only" permissions only. 
        // If our permissions are all "actions", then this list is empty.
        // However, if we gate screens (BILLING_VIEW), we need that.
        PERMISSIONS.BILLING_VIEW,
    ],
};
