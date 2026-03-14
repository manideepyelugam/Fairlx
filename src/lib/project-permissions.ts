import { ProjectPermissionKey } from "./permissions/types";

export const PROJECT_PERMISSIONS = {
    // Project Management
    PROJECT_VIEW: ProjectPermissionKey.VIEW_PROJECT,
    PROJECT_SETTINGS_MANAGE: ProjectPermissionKey.MANAGE_SETTINGS,

    // Team Management
    TEAM_CREATE: ProjectPermissionKey.CREATE_TEAMS,
    TEAM_MANAGE: ProjectPermissionKey.MANAGE_TEAMS,

    // Member Management
    MEMBER_INVITE: ProjectPermissionKey.INVITE_MEMBERS,
    MEMBER_REMOVE: ProjectPermissionKey.REMOVE_MEMBERS,

    // Task/Work Item Management
    TASK_CREATE: ProjectPermissionKey.CREATE_TASKS,
    TASK_UPDATE: ProjectPermissionKey.EDIT_TASKS,
    TASK_DELETE: ProjectPermissionKey.DELETE_TASKS,
    TASK_ASSIGN: ProjectPermissionKey.ASSIGN_TASKS,

    // Sprint Management
    SPRINT_VIEW: ProjectPermissionKey.VIEW_SPRINTS,
    SPRINT_CREATE: ProjectPermissionKey.CREATE_SPRINTS,
    SPRINT_UPDATE: ProjectPermissionKey.EDIT_SPRINTS,
    SPRINT_START: ProjectPermissionKey.START_SPRINT,
    SPRINT_COMPLETE: ProjectPermissionKey.COMPLETE_SPRINT,
    SPRINT_DELETE: ProjectPermissionKey.DELETE_SPRINTS,

    // Board Management
    BOARD_VIEW: ProjectPermissionKey.VIEW_BOARD,
    BOARD_MANAGE: ProjectPermissionKey.UPDATE_BOARD,

    // Comments
    COMMENT_CREATE: ProjectPermissionKey.CREATE_COMMENTS,
    COMMENT_DELETE: ProjectPermissionKey.DELETE_COMMENTS,

    // Role Management (within project)
    ROLE_CREATE: ProjectPermissionKey.CREATE_ROLES,
    ROLE_UPDATE: ProjectPermissionKey.MANAGE_PERMISSIONS,
    ROLE_DELETE: ProjectPermissionKey.DELETE_ROLES,

    // Reports & Analytics
    REPORTS_VIEW: ProjectPermissionKey.VIEW_REPORTS,
    REPORTS_EXPORT: ProjectPermissionKey.VIEW_REPORTS, // Fallback
} as const;

export type ProjectPermission = typeof PROJECT_PERMISSIONS[keyof typeof PROJECT_PERMISSIONS];

/**
 * Permission Categories for UI display (permission matrix)
 */
export const PROJECT_PERMISSION_CATEGORIES = {
    PROJECT: {
        label: "Project",
        permissions: [
            { key: PROJECT_PERMISSIONS.PROJECT_VIEW, label: "View Project", description: "View project details and content" },
            { key: PROJECT_PERMISSIONS.PROJECT_SETTINGS_MANAGE, label: "Manage Settings", description: "Edit project settings and configuration" },
        ],
    },
    TEAMS: {
        label: "Teams",
        permissions: [
            { key: PROJECT_PERMISSIONS.TEAM_CREATE, label: "Create Teams", description: "Create new teams in project" },
            { key: PROJECT_PERMISSIONS.TEAM_MANAGE, label: "Manage Teams", description: "Edit and delete teams" },
        ],
    },
    MEMBERS: {
        label: "Members",
        permissions: [
            { key: PROJECT_PERMISSIONS.MEMBER_INVITE, label: "Invite Members", description: "Invite users to project teams" },
            { key: PROJECT_PERMISSIONS.MEMBER_REMOVE, label: "Remove Members", description: "Remove users from project teams" },
        ],
    },
    TASKS: {
        label: "Work Items",
        permissions: [
            { key: PROJECT_PERMISSIONS.TASK_CREATE, label: "Create Work Items", description: "Create new tasks, bugs, stories" },
            { key: PROJECT_PERMISSIONS.TASK_UPDATE, label: "Update Work Items", description: "Edit existing work items" },
            { key: PROJECT_PERMISSIONS.TASK_DELETE, label: "Delete Work Items", description: "Delete work items" },
            { key: PROJECT_PERMISSIONS.TASK_ASSIGN, label: "Assign Work Items", description: "Assign work items to users" },
        ],
    },
    SPRINTS: {
        label: "Sprints",
        permissions: [
            { key: PROJECT_PERMISSIONS.SPRINT_VIEW, label: "View Sprints", description: "View sprint details" },
            { key: PROJECT_PERMISSIONS.SPRINT_CREATE, label: "Create Sprints", description: "Create new sprints" },
            { key: PROJECT_PERMISSIONS.SPRINT_UPDATE, label: "Update Sprints", description: "Edit sprint details" },
            { key: PROJECT_PERMISSIONS.SPRINT_START, label: "Start Sprints", description: "Start planned sprints" },
            { key: PROJECT_PERMISSIONS.SPRINT_COMPLETE, label: "Complete Sprints", description: "Complete active sprints" },
            { key: PROJECT_PERMISSIONS.SPRINT_DELETE, label: "Delete Sprints", description: "Delete sprints" },
        ],
    },
    BOARD: {
        label: "Board",
        permissions: [
            { key: PROJECT_PERMISSIONS.BOARD_VIEW, label: "View Board", description: "View Kanban/Scrum board" },
            { key: PROJECT_PERMISSIONS.BOARD_MANAGE, label: "Manage Board", description: "Configure board columns and settings" },
        ],
    },
    COMMENTS: {
        label: "Comments",
        permissions: [
            { key: PROJECT_PERMISSIONS.COMMENT_CREATE, label: "Add Comments", description: "Add comments to work items" },
            { key: PROJECT_PERMISSIONS.COMMENT_DELETE, label: "Delete Comments", description: "Delete any comments" },
        ],
    },
    ROLES: {
        label: "Roles",
        permissions: [
            { key: PROJECT_PERMISSIONS.ROLE_CREATE, label: "Create Roles", description: "Create custom roles" },
            { key: PROJECT_PERMISSIONS.ROLE_UPDATE, label: "Update Roles", description: "Edit role permissions" },
            { key: PROJECT_PERMISSIONS.ROLE_DELETE, label: "Delete Roles", description: "Delete custom roles" },
        ],
    },
    REPORTS: {
        label: "Reports",
        permissions: [
            { key: PROJECT_PERMISSIONS.REPORTS_VIEW, label: "View Reports", description: "View analytics and reports" },
            { key: PROJECT_PERMISSIONS.REPORTS_EXPORT, label: "Export Reports", description: "Export data and reports" },
        ],
    },
} as const;

/**
 * Default Role Templates
 */
export const DEFAULT_PROJECT_ROLES = {
    PROJECT_ADMIN: {
        name: "Project Admin",
        description: "Full access to all project features",
        permissions: Object.values(ProjectPermissionKey),
    },
    PROJECT_MEMBER: {
        name: "Project Member",
        description: "Can work on tasks, view sprints, and collaborate",
        permissions: [
            ProjectPermissionKey.VIEW_PROJECT,
            ProjectPermissionKey.CREATE_TASKS,
            ProjectPermissionKey.EDIT_TASKS,
            ProjectPermissionKey.ASSIGN_TASKS,
            ProjectPermissionKey.VIEW_SPRINTS,
            ProjectPermissionKey.VIEW_BOARD,
            ProjectPermissionKey.CREATE_COMMENTS,
            ProjectPermissionKey.VIEW_REPORTS,
        ],
    },
    VIEWER: {
        name: "Viewer",
        description: "Read-only access to project content",
        permissions: [
            ProjectPermissionKey.VIEW_PROJECT,
            ProjectPermissionKey.VIEW_SPRINTS,
            ProjectPermissionKey.VIEW_BOARD,
            ProjectPermissionKey.VIEW_REPORTS,
        ],
    },
} as const;
