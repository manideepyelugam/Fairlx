/**
 * CENTRALIZED Cache Key Registry + TTL Configuration
 * 
 * Every cacheable data point in the entire PMT is defined here.
 * No magic strings elsewhere — all keys go through this module.
 * 
 * Naming convention: domain:entity:id[:qualifier]
 * Pattern convention: domain:entity:id:* (for invalidation)
 */

// =============================================================
// TTL CONFIGURATION (seconds)
// =============================================================
export const TTL = {
    // ── AUTHENTICATION & SESSION ──
    AUTH_LIFECYCLE: 30,           // Polled every navigation, changes on prefs update

    // ── PERMISSIONS (change on member/role CRUD only) ──
    PROJECT_ACCESS: 120,          // resolveUserProjectAccess() — 5-10 queries saved
    ORG_ACCESS: 180,              // resolveUserOrgAccess() — 3-5 queries saved
    WORKSPACE_RBAC: 120,          // resolveWorkspacePermissions() — 2 queries saved
    WORKSPACE_MEMBER: 120,        // getMember() — 1-2 queries saved, called EVERYWHERE
    WORKFLOW_PERMISSION: 120,     // checkWorkflowPermission()

    // ── BILLING (changes on payment events only) ──
    BILLING_ACCOUNT: 300,         // resolveBillingAccount() — very stable
    BILLING_STATUS: 120,          // ACTIVE/DUE/SUSPENDED — checked every request
    WALLET_BALANCE: 30,           // Changes on transactions

    // ── ENTITY DOCUMENTS (change on explicit update only) ──
    WORKSPACE: 300,
    PROJECT: 300,
    SPACE: 300,
    SPRINT: 120,
    WORKFLOW: 600,                // Workflows change very rarely
    WORKFLOW_STATUSES: 600,       // Status definitions change very rarely
    WORKFLOW_TRANSITIONS: 600,    // Transition rules change very rarely
    CUSTOM_FIELDS: 600,           // Custom field definitions
    CUSTOM_COLUMNS: 600,          // Custom column definitions
    SAVED_VIEW: 300,              // User's saved views/filters
    ORGANIZATION: 300,

    // ── LISTS (change on item CRUD) ──
    TASK_LIST: 15,                // Board/list views — short TTL, high frequency
    WORK_ITEM_LIST: 15,           // Sprint board — short TTL, high frequency
    SPRINT_LIST: 30,              // Sprint planning — moderate changes
    PROJECT_LIST: 60,             // Workspace project list — changes on project CRUD
    SPACE_LIST: 60,               // Space overview — changes on space CRUD
    MEMBER_LIST: 60,              // Workspace/project member list
    COMMENT_LIST: 15,             // Task comments — changes on comment CRUD
    MY_SPACE_ITEMS: 20,           // Cross-workspace work items for user
    NOTIFICATION_LIST: 10,        // Notification feed
    EPIC_LIST: 60,                // Epics per project — moderate changes

    // ── COUNTERS (change on related CRUD) ──
    NOTIFICATION_UNREAD: 10,      // Polled every ~10s per user
    COMMENT_COUNT: 30,            // Per-task comment count
    WORK_ITEM_COUNT: 30,          // Per-sprint work item count
    SPACE_PROJECT_COUNT: 60,      // Per-space project count
    SPACE_MEMBER_COUNT: 60,       // Per-space member count

    // ── ANALYTICS (inherently aggregated, expensive to compute) ──
    PROJECT_ANALYTICS: 60,        // 10 count queries → 1 cached result
    WORKSPACE_ANALYTICS: 60,      // Similar aggregation
    SPRINT_BURNDOWN: 30,          // Sprint progress tracking

    // ── USER/MEMBER RESOLUTION (almost never changes) ──
    MEMBER_TO_USER: 3600,         // Member doc ID → user profile (1 hour)
    USER_PROFILE: 3600,           // User name/email/avatar (1 hour)
    WORKSPACE_ADMINS: 300,        // List of admin users in workspace

    // ── WRITE-PATH (operational, not content caching) ──
    IDEMPOTENCY: 3600,            // Usage write dedup (1 hour)
    RATE_LIMIT: 60,               // Sliding window
    WORK_ITEM_KEY_SEQ: 60,        // Next key number for work item generation
} as const;

// =============================================================
// CACHE KEY BUILDERS
// =============================================================
export const CK = {
    // ── AUTHENTICATION ──
    authLifecycle: (userId: string) =>
        `auth:lifecycle:${userId}`,

    // ── PERMISSIONS ──
    projectAccess: (userId: string, projectId: string) =>
        `perm:proj:${projectId}:${userId}`,
    orgAccess: (userId: string, orgId: string) =>
        `perm:org:${orgId}:${userId}`,
    workspaceRbac: (userId: string, workspaceId: string) =>
        `perm:ws:${workspaceId}:${userId}`,
    workspaceMember: (userId: string, workspaceId: string) =>
        `member:ws:${workspaceId}:${userId}`,
    workflowPermission: (userId: string, workspaceId: string, spaceId?: string) =>
        `perm:wf:${workspaceId}:${spaceId || "none"}:${userId}`,

    // ── BILLING ──
    billingAccount: (entityId: string) =>
        `billing:acct:${entityId}`,
    billingStatus: (entityId: string) =>
        `billing:status:${entityId}`,
    walletBalance: (walletId: string) =>
        `wallet:bal:${walletId}`,

    // ── ENTITY DOCUMENTS ──
    workspace: (id: string) => `doc:ws:${id}`,
    project: (id: string) => `doc:proj:${id}`,
    space: (id: string) => `doc:space:${id}`,
    sprint: (id: string) => `doc:sprint:${id}`,
    workflow: (id: string) => `doc:wf:${id}`,
    workflowStatuses: (workflowId: string) => `doc:wfst:${workflowId}`,
    workflowTransitions: (workflowId: string) => `doc:wftr:${workflowId}`,
    customFields: (workspaceId: string, projectId?: string) =>
        `doc:cf:${workspaceId}:${projectId || "all"}`,
    customColumns: (workspaceId: string) => `doc:cc:${workspaceId}`,
    savedViews: (userId: string, workspaceId: string, projectId?: string) =>
        `doc:sv:${workspaceId}:${userId}:${projectId || "all"}`,
    organization: (id: string) => `doc:org:${id}`,

    // ── LISTS ──
    taskList: (workspaceId: string, filterHash: string) =>
        `list:tasks:${workspaceId}:${filterHash}`,
    workItemList: (workspaceId: string, filterHash: string) =>
        `list:witems:${workspaceId}:${filterHash}`,
    sprintList: (workspaceId: string, projectId: string) =>
        `list:sprints:${workspaceId}:${projectId}`,
    projectList: (workspaceId: string) =>
        `list:projects:${workspaceId}`,
    spaceList: (workspaceId: string) =>
        `list:spaces:${workspaceId}`,
    memberList: (workspaceId: string) =>
        `list:members:${workspaceId}`,
    projectMemberList: (projectId: string) =>
        `list:pmembers:${projectId}`,
    commentList: (taskId: string) =>
        `list:comments:${taskId}`,
    mySpaceItems: (userId: string) =>
        `list:myspace:${userId}`,
    notificationList: (userId: string) =>
        `list:notifs:${userId}`,
    epicList: (projectId: string) =>
        `list:epics:${projectId}`,

    // ── COUNTERS ──
    notifUnread: (userId: string) =>
        `cnt:notif:${userId}`,
    commentCount: (taskId: string) =>
        `cnt:comments:${taskId}`,
    workItemCount: (sprintId: string) =>
        `cnt:witems:${sprintId}`,
    spaceProjectCount: (spaceId: string) =>
        `cnt:sproj:${spaceId}`,
    spaceMemberCount: (spaceId: string) =>
        `cnt:smem:${spaceId}`,

    // ── ANALYTICS ──
    projectAnalytics: (projectId: string, month: string) =>
        `analytics:proj:${projectId}:${month}`,
    workspaceAnalytics: (workspaceId: string, month: string) =>
        `analytics:ws:${workspaceId}:${month}`,
    sprintBurndown: (sprintId: string) =>
        `analytics:burndown:${sprintId}`,

    // ── USER/MEMBER RESOLUTION ──
    memberToUser: (memberId: string) =>
        `resolve:m2u:${memberId}`,
    userProfile: (userId: string) =>
        `resolve:user:${userId}`,
    workspaceAdmins: (workspaceId: string) =>
        `resolve:admins:${workspaceId}`,

    // ── WRITE-PATH ──
    idempotency: (key: string) =>
        `idem:${key}`,
    rateLimit: (userId: string, endpoint: string) =>
        `rate:${endpoint}:${userId}`,
    workItemKeySeq: (projectId: string) =>
        `seq:wikey:${projectId}`,
} as const;

// =============================================================
// INVALIDATION PATTERN BUILDERS (for bulk invalidation)
// =============================================================
export const CKPattern = {
    /** When project members change → invalidate all permission caches for that project */
    projectPerms: (projectId: string) => `perm:proj:${projectId}:*`,
    /** When org members/roles change → invalidate all org permission caches */
    orgPerms: (orgId: string) => `perm:org:${orgId}:*`,
    /** When workspace members change */
    workspacePerms: (workspaceId: string) => `perm:ws:${workspaceId}:*`,
    workspaceMembers: (workspaceId: string) => `member:ws:${workspaceId}:*`,
    /** When billing status changes */
    billingEntity: (entityId: string) => `billing:*:${entityId}`,
    /** When tasks change in a workspace (invalidate all task list views) */
    taskLists: (workspaceId: string) => `list:tasks:${workspaceId}:*`,
    /** When work items change */
    workItemLists: (workspaceId: string) => `list:witems:${workspaceId}:*`,
    /** When sprints change in a project */
    sprintLists: (workspaceId: string) => `list:sprints:${workspaceId}:*`,
    /** When a user's notifications change */
    userNotifs: (userId: string) => `list:notifs:${userId}`,
    /** When workflow definitions change */
    workflowData: (workflowId: string) => `doc:wf*:${workflowId}`,
    /** All permissions for a user (across all contexts) */
    allUserPerms: (userId: string) => `perm:*:*:${userId}`,
} as const;

// =============================================================
// FILTER HASH UTILITY
// =============================================================

/**
 * Generate a deterministic hash for filter combinations.
 * Used to create unique cache keys for different board/list views.
 * 
 * Example: taskList("ws123", hashFilters({ projectId: "p1", status: "TODO" }))
 */
export function hashFilters(filters: Record<string, string | null | undefined>): string {
    const sorted = Object.entries(filters)
        .filter(([, v]) => v != null)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&");

    // Simple hash — not cryptographic, just for cache key uniqueness
    let hash = 0;
    for (let i = 0; i < sorted.length; i++) {
        const char = sorted.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}
