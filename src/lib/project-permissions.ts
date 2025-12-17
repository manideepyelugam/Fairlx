/**
 * Project-Scoped Permission Constants
 * 
 * These flat permission strings are used for project-level RBAC.
 * NO hardcoded role names - only permission strings.
 */

export const PROJECT_PERMISSIONS = {
    // Project Management
    PROJECT_VIEW: "project.view",
    PROJECT_SETTINGS_MANAGE: "project.settings.manage",

    // Team Management
    TEAM_CREATE: "team.create",
    TEAM_MANAGE: "team.manage",

    // Member Management
    MEMBER_INVITE: "member.invite",
    MEMBER_REMOVE: "member.remove",

    // Task/Work Item Management
    TASK_CREATE: "task.create",
    TASK_UPDATE: "task.update",
    TASK_DELETE: "task.delete",
    TASK_ASSIGN: "task.assign",

    // Sprint Management
    SPRINT_VIEW: "sprint.view",
    SPRINT_CREATE: "sprint.create",
    SPRINT_UPDATE: "sprint.update",
    SPRINT_START: "sprint.start",
    SPRINT_COMPLETE: "sprint.complete",
    SPRINT_DELETE: "sprint.delete",

    // Board Management
    BOARD_VIEW: "board.view",
    BOARD_MANAGE: "board.manage",

    // Comments
    COMMENT_CREATE: "comment.create",
    COMMENT_DELETE: "comment.delete",

    // Role Management (within project)
    ROLE_CREATE: "role.create",
    ROLE_UPDATE: "role.update",
    ROLE_DELETE: "role.delete",

    // Reports & Analytics
    REPORTS_VIEW: "reports.view",
    REPORTS_EXPORT: "reports.export",
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
 * Used during migration and when creating default roles for new projects
 */
export const DEFAULT_PROJECT_ROLES = {
    PROJECT_ADMIN: {
        name: "Project Admin",
        description: "Full access to all project features",
        permissions: Object.values(PROJECT_PERMISSIONS),
    },
    PROJECT_MEMBER: {
        name: "Project Member",
        description: "Can work on tasks, view sprints, and collaborate",
        permissions: [
            PROJECT_PERMISSIONS.PROJECT_VIEW,
            PROJECT_PERMISSIONS.TASK_CREATE,
            PROJECT_PERMISSIONS.TASK_UPDATE,
            PROJECT_PERMISSIONS.TASK_ASSIGN,
            PROJECT_PERMISSIONS.SPRINT_VIEW,
            PROJECT_PERMISSIONS.BOARD_VIEW,
            PROJECT_PERMISSIONS.COMMENT_CREATE,
            PROJECT_PERMISSIONS.REPORTS_VIEW,
        ],
    },
    VIEWER: {
        name: "Viewer",
        description: "Read-only access to project content",
        permissions: [
            PROJECT_PERMISSIONS.PROJECT_VIEW,
            PROJECT_PERMISSIONS.SPRINT_VIEW,
            PROJECT_PERMISSIONS.BOARD_VIEW,
            PROJECT_PERMISSIONS.REPORTS_VIEW,
        ],
    },
} as const;
