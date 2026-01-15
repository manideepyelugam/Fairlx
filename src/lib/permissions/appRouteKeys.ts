/**
 * App Route Keys
 * 
 * Canonical route identifiers that serve as the SINGLE SOURCE OF TRUTH
 * for all navigable surfaces in the application.
 * 
 * NOTE: This file is intentionally NOT server-only because the AppRouteKey
 * enum is shared with client components for type-safe navigation.
 * Server-only logic should be in other files that import from here.
 * 
 * RULES:
 * - Every navigable route MUST have a corresponding AppRouteKey
 * - Route keys are used to gate navigation and route access
 * - Never add routes without corresponding keys
 * 
 * INVARIANTS:
 * - AppRouteKey → concrete Next.js path is defined in permissionRouteMap.ts
 * - OrgPermissionKey → AppRouteKey mapping is defined in permissionRouteMap.ts
 */

// ============================================================================
// ORG-LEVEL ROUTE KEYS
// ============================================================================

export enum AppRouteKey {
    // Organization routes (work without workspace)
    ORG_DASHBOARD = "ORG_DASHBOARD",
    ORG_MEMBERS = "ORG_MEMBERS",
    ORG_SETTINGS = "ORG_SETTINGS",
    ORG_BILLING = "ORG_BILLING",
    ORG_USAGE = "ORG_USAGE",
    ORG_AUDIT = "ORG_AUDIT",
    ORG_DEPARTMENTS = "ORG_DEPARTMENTS",
    ORG_SECURITY = "ORG_SECURITY",
    ORG_PERMISSIONS = "ORG_PERMISSIONS",

    // Workspace routes
    WORKSPACES = "WORKSPACES",
    WORKSPACE_CREATE = "WORKSPACE_CREATE",
    WORKSPACE_HOME = "WORKSPACE_HOME",
    WORKSPACE_TASKS = "WORKSPACE_TASKS",
    WORKSPACE_TEAMS = "WORKSPACE_TEAMS",
    WORKSPACE_PROGRAMS = "WORKSPACE_PROGRAMS",
    WORKSPACE_TIMELINE = "WORKSPACE_TIMELINE",
    WORKSPACE_SETTINGS = "WORKSPACE_SETTINGS",
    WORKSPACE_SPACES = "WORKSPACE_SPACES",
    WORKSPACE_PROJECTS = "WORKSPACE_PROJECTS",

    // Profile routes (always accessible to authenticated users)
    PROFILE = "PROFILE",
    PROFILE_ACCOUNT = "PROFILE_ACCOUNT",
    PROFILE_PASSWORD = "PROFILE_PASSWORD",

    // Welcome/onboarding
    WELCOME = "WELCOME",
}

// ============================================================================
// ROUTE KEY METADATA
// ============================================================================

export interface RouteKeyMetadata {
    label: string;
    description: string;
    category: "org" | "workspace" | "profile" | "system";
    requiresWorkspace: boolean;
}

export const ROUTE_KEY_METADATA: Record<AppRouteKey, RouteKeyMetadata> = {
    // Org routes
    [AppRouteKey.ORG_DASHBOARD]: {
        label: "Organization Dashboard",
        description: "Organization overview and summary",
        category: "org",
        requiresWorkspace: false,
    },
    [AppRouteKey.ORG_MEMBERS]: {
        label: "Members",
        description: "View and manage organization members",
        category: "org",
        requiresWorkspace: false,
    },
    [AppRouteKey.ORG_SETTINGS]: {
        label: "Organization Settings",
        description: "Manage organization settings",
        category: "org",
        requiresWorkspace: false,
    },
    [AppRouteKey.ORG_BILLING]: {
        label: "Billing",
        description: "View and manage billing",
        category: "org",
        requiresWorkspace: false,
    },
    [AppRouteKey.ORG_USAGE]: {
        label: "Usage",
        description: "View organization usage metrics",
        category: "org",
        requiresWorkspace: false,
    },
    [AppRouteKey.ORG_AUDIT]: {
        label: "Audit Logs",
        description: "View audit logs and activity",
        category: "org",
        requiresWorkspace: false,
    },
    [AppRouteKey.ORG_DEPARTMENTS]: {
        label: "Departments",
        description: "Manage departments",
        category: "org",
        requiresWorkspace: false,
    },
    [AppRouteKey.ORG_SECURITY]: {
        label: "Security",
        description: "View security settings",
        category: "org",
        requiresWorkspace: false,
    },
    [AppRouteKey.ORG_PERMISSIONS]: {
        label: "Permissions",
        description: "Manage member permissions",
        category: "org",
        requiresWorkspace: false,
    },

    // Workspace routes
    [AppRouteKey.WORKSPACES]: {
        label: "Workspaces",
        description: "View all workspaces",
        category: "workspace",
        requiresWorkspace: false,
    },
    [AppRouteKey.WORKSPACE_CREATE]: {
        label: "Create Workspace",
        description: "Create a new workspace",
        category: "workspace",
        requiresWorkspace: false,
    },
    [AppRouteKey.WORKSPACE_HOME]: {
        label: "Home",
        description: "Workspace home/dashboard",
        category: "workspace",
        requiresWorkspace: true,
    },
    [AppRouteKey.WORKSPACE_TASKS]: {
        label: "My Spaces",
        description: "View and manage tasks",
        category: "workspace",
        requiresWorkspace: true,
    },
    [AppRouteKey.WORKSPACE_TEAMS]: {
        label: "Teams",
        description: "View and manage teams",
        category: "workspace",
        requiresWorkspace: true,
    },
    [AppRouteKey.WORKSPACE_PROGRAMS]: {
        label: "Programs",
        description: "View and manage programs",
        category: "workspace",
        requiresWorkspace: true,
    },
    [AppRouteKey.WORKSPACE_TIMELINE]: {
        label: "Timeline",
        description: "View timeline",
        category: "workspace",
        requiresWorkspace: true,
    },
    [AppRouteKey.WORKSPACE_SETTINGS]: {
        label: "Settings",
        description: "Workspace settings",
        category: "workspace",
        requiresWorkspace: true,
    },
    [AppRouteKey.WORKSPACE_SPACES]: {
        label: "Spaces",
        description: "View and manage spaces",
        category: "workspace",
        requiresWorkspace: true,
    },
    [AppRouteKey.WORKSPACE_PROJECTS]: {
        label: "Projects",
        description: "View and manage projects",
        category: "workspace",
        requiresWorkspace: true,
    },

    // Profile routes
    [AppRouteKey.PROFILE]: {
        label: "Profile",
        description: "User profile",
        category: "profile",
        requiresWorkspace: false,
    },
    [AppRouteKey.PROFILE_ACCOUNT]: {
        label: "Account Info",
        description: "Account information settings",
        category: "profile",
        requiresWorkspace: false,
    },
    [AppRouteKey.PROFILE_PASSWORD]: {
        label: "Password",
        description: "Password settings",
        category: "profile",
        requiresWorkspace: false,
    },

    // System routes
    [AppRouteKey.WELCOME]: {
        label: "Welcome",
        description: "Welcome page",
        category: "system",
        requiresWorkspace: false,
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all route keys that don't require a workspace
 */
export function getWorkspaceIndependentRouteKeys(): AppRouteKey[] {
    return Object.entries(ROUTE_KEY_METADATA)
        .filter(([, meta]) => !meta.requiresWorkspace)
        .map(([key]) => key as AppRouteKey);
}

/**
 * Get all org-level route keys
 */
export function getOrgRouteKeys(): AppRouteKey[] {
    return Object.entries(ROUTE_KEY_METADATA)
        .filter(([, meta]) => meta.category === "org")
        .map(([key]) => key as AppRouteKey);
}

/**
 * Get all workspace route keys
 */
export function getWorkspaceRouteKeys(): AppRouteKey[] {
    return Object.entries(ROUTE_KEY_METADATA)
        .filter(([, meta]) => meta.category === "workspace")
        .map(([key]) => key as AppRouteKey);
}

/**
 * Check if a route key requires workspace context
 */
export function routeRequiresWorkspace(key: AppRouteKey): boolean {
    return ROUTE_KEY_METADATA[key]?.requiresWorkspace ?? false;
}
