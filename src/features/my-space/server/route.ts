import { Query, Models } from "node-appwrite";
import { Hono } from "hono";

import { DATABASE_ID, WORK_ITEMS_ID, PROJECTS_ID, MEMBERS_ID, SPRINTS_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { batchGetUsers } from "@/lib/batch-users";
import { Project } from "@/features/projects/types";
import {
    WorkItem,
    PopulatedWorkItem,
    PopulatedSprint,
    Sprint,
} from "@/features/sprints/types";
import { Member } from "@/features/members/types";
import { getActivityLogs, formatActivityDescription } from "@/features/audit-logs/utils";

/**
 * My Space API — Cross-Workspace Work Items
 *
 * Fetches ALL work items assigned to the current user across ALL workspaces.
 * For personal accounts (1 workspace), this returns items from that single workspace.
 * For org accounts (N workspaces), this aggregates across all workspaces.
 *
 * SECURITY: Filtering is enforced server-side via userId → member lookup.
 *           The user can only see items where they are an assignee.
 */

const app = new Hono()
    .get(
        "/work-items",
        sessionMiddleware,
        async (c) => {
            const { users, databases: adminDatabases } = await createAdminClient();
            const user = c.get("user");

            // ================================================================
            // 1. Find ALL workspace memberships for this user
            // ================================================================

            let allMemberships;
            try {
                allMemberships = await adminDatabases.listDocuments(
                    DATABASE_ID,
                    MEMBERS_ID,
                    [
                        Query.equal("userId", user.$id),
                        Query.limit(100),
                    ]
                );
            } catch {
                return c.json({
                    data: { documents: [], total: 0 },
                });
            }

            // Filter out soft-deleted memberships in-memory (safer than Query.isNull)
            const activeMemberships = allMemberships.documents.filter(
                (m: Models.Document) => !m.deletedAt
            );



            if (activeMemberships.length === 0) {
                return c.json({
                    data: { documents: [], total: 0 },
                });
            }

            // ================================================================
            // 2. For each workspace, fetch work items assigned to the user's
            //    member $id — in PARALLEL
            // ================================================================
            const allWorkItemArrays = await Promise.all(
                activeMemberships.map(async (member) => {
                    try {
                        const items = await adminDatabases.listDocuments<WorkItem>(
                            DATABASE_ID,
                            WORK_ITEMS_ID,
                            [
                                Query.equal("workspaceId", member.workspaceId),
                                Query.equal("assigneeIds", member.$id),
                                Query.orderAsc("position"),
                                Query.limit(200),
                            ]
                        );
                        return items.documents;
                    } catch {
                        // If one workspace query fails, don't break the whole response
                        return [];
                    }
                })
            );

            const mergedItems = allWorkItemArrays.flat();

            if (mergedItems.length === 0) {
                return c.json({
                    data: { documents: [], total: 0 },
                });
            }

            // Sort merged items by key numerically (e.g., FAIR-2 before FAIR-10)
            mergedItems.sort((a: WorkItem, b: WorkItem) => {
                const numA = parseInt(a.key?.split("-")[1] || "0", 10);
                const numB = parseInt(b.key?.split("-")[1] || "0", 10);
                return numA - numB;
            });

            // ================================================================
            // 3. Batch-populate assignees, projects, epics, parents
            //    (Same optimized pattern as work-items-route.ts)
            // ================================================================

            // Collect all unique IDs for batch fetching
            const allAssigneeIds = new Set<string>();
            const epicIds = new Set<string>();
            const parentIds = new Set<string>();
            const projectIds = new Set<string>();

            mergedItems.forEach((workItem: WorkItem) => {
                if (workItem.assigneeIds && Array.isArray(workItem.assigneeIds)) {
                    workItem.assigneeIds.forEach((id: string) => {
                        if (id && typeof id === "string") allAssigneeIds.add(id);
                    });
                }
                if (workItem.epicId) epicIds.add(workItem.epicId);
                if (workItem.parentId) parentIds.add(workItem.parentId);
                if (workItem.projectId) projectIds.add(workItem.projectId);
            });

            // Fetch all members (assignees) in one batch
            const membersData =
                allAssigneeIds.size > 0
                    ? await adminDatabases.listDocuments(DATABASE_ID, MEMBERS_ID, [
                        Query.equal("$id", Array.from(allAssigneeIds)),
                        Query.limit(allAssigneeIds.size),
                    ])
                    : { documents: [] };

            // Batch-fetch user profiles
            const memberUserIds = membersData.documents.map(
                (m) => m.userId as string
            );
            const userMap = await batchGetUsers(users, memberUserIds);

            // Build assignee lookup map
            const assigneeMap = new Map<
                string,
                {
                    $id: string;
                    name: string;
                    email: string;
                    profileImageUrl: string | null;
                }
            >();
            membersData.documents.forEach((member) => {
                const userData = userMap.get(member.userId as string);
                if (userData) {
                    assigneeMap.set(member.$id, {
                        $id: member.$id,
                        name: userData.name || userData.email,
                        email: userData.email,
                        profileImageUrl: userData.prefs?.profileImageUrl || null,
                    });
                }
            });

            // Batch fetch epics and parents
            const relatedWorkItemIds = [
                ...new Set([...epicIds, ...parentIds]),
            ];
            const relatedWorkItemsMap = new Map<
                string,
                { $id: string; key: string; title: string }
            >();

            if (relatedWorkItemIds.length > 0) {
                try {
                    const relatedWorkItems = await adminDatabases.listDocuments<WorkItem>(
                        DATABASE_ID,
                        WORK_ITEMS_ID,
                        [
                            Query.equal("$id", relatedWorkItemIds),
                            Query.limit(relatedWorkItemIds.length),
                        ]
                    );
                    relatedWorkItems.documents.forEach((item) => {
                        relatedWorkItemsMap.set(item.$id, {
                            $id: item.$id,
                            key: item.key,
                            title: item.title,
                        });
                    });
                } catch {
                    // Related items fetch failed - continue without them
                }
            }

            // Batch fetch all projects
            const projectMap = new Map<
                string,
                { $id: string; name: string; imageUrl?: string }
            >();
            const projectIdArray = Array.from(projectIds);

            if (projectIdArray.length > 0) {
                try {
                    const projects = await adminDatabases.listDocuments<Project>(
                        DATABASE_ID,
                        PROJECTS_ID,
                        [
                            Query.equal("$id", projectIdArray),
                            Query.limit(projectIdArray.length),
                        ]
                    );
                    projects.documents.forEach((proj) => {
                        projectMap.set(proj.$id, {
                            $id: proj.$id,
                            name: proj.name,
                            imageUrl: proj.imageUrl || undefined,
                        });
                    });
                } catch {
                    // Projects fetch failed - continue without them
                }
            }

            // ================================================================
            // 4. Assemble populated work items
            // ================================================================
            const populatedWorkItems: PopulatedWorkItem[] = mergedItems.map(
                (workItem: WorkItem) => {
                    const assignees = (workItem.assigneeIds || [])
                        .map((id: string) => assigneeMap.get(id))
                        .filter(
                            (a: unknown): a is NonNullable<typeof a> => a !== null && a !== undefined
                        );

                    const epic = workItem.epicId
                        ? relatedWorkItemsMap.get(workItem.epicId) || null
                        : null;

                    const parent = workItem.parentId
                        ? relatedWorkItemsMap.get(workItem.parentId) || null
                        : null;

                    const project = workItem.projectId
                        ? projectMap.get(workItem.projectId) || null
                        : null;

                    return {
                        ...workItem,
                        type: workItem.type || "TASK",
                        assignees,
                        epic,
                        parent,
                        project,
                        childrenCount: 0, // Skip children count for My Space (perf)
                        commentCount: 0,  // Skip comment count for My Space (perf)
                    } as PopulatedWorkItem;
                }
            );

            return c.json({
                data: {
                    documents: populatedWorkItems,
                    total: populatedWorkItems.length,
                },
            });
        }
    )
    .get(
        "/projects",
        sessionMiddleware,
        async (c) => {
            const { databases: adminDatabases } = await createAdminClient();
            const user = c.get("user");

            // 1. Find ALL workspace memberships for this user
            let allMemberships;
            try {
                allMemberships = await adminDatabases.listDocuments(
                    DATABASE_ID,
                    MEMBERS_ID,
                    [
                        Query.equal("userId", user.$id),
                        Query.limit(100),
                    ]
                );
            } catch {
                return c.json({
                    data: { documents: [], total: 0 },
                });
            }

            const activeMemberships = allMemberships.documents.filter(
                (m: Models.Document) => !m.deletedAt
            );

            if (activeMemberships.length === 0) {
                return c.json({
                    data: { documents: [], total: 0 },
                });
            }

            // 2. Fetch projects for each workspace in parallel
            const allProjectArrays = await Promise.all(
                activeMemberships.map(async (member) => {
                    try {
                        const projects = await adminDatabases.listDocuments<Project>(
                            DATABASE_ID,
                            PROJECTS_ID,
                            [
                                Query.equal("workspaceId", member.workspaceId),
                                Query.orderDesc("$createdAt"),
                            ]
                        );
                        return projects.documents;
                    } catch {
                        return [];
                    }
                })
            );

            const mergedProjects = allProjectArrays.flat();

            // Transform projects (parse JSON fields)
            const transformProject = (project: Project): Project => {
                const raw = project as unknown as Record<string, unknown>;
                return {
                    ...project,
                    customWorkItemTypes: typeof raw.customWorkItemTypes === 'string'
                        ? JSON.parse(raw.customWorkItemTypes)
                        : (raw.customWorkItemTypes as Project["customWorkItemTypes"]) || [],
                    customPriorities: typeof raw.customPriorities === 'string'
                        ? JSON.parse(raw.customPriorities)
                        : (raw.customPriorities as Project["customPriorities"]) || [],
                    customLabels: typeof raw.customLabels === 'string'
                        ? JSON.parse(raw.customLabels)
                        : (raw.customLabels as Project["customLabels"]) || [],
                };
            };

            const transformedProjects = mergedProjects.map(transformProject);

            return c.json({
                data: {
                    documents: transformedProjects,
                    total: transformedProjects.length,
                },
            });
        }
    )
    .get(
        "/sprints",
        sessionMiddleware,
        async (c) => {
            const { databases: adminDatabases } = await createAdminClient();
            const user = c.get("user");

            // 1. Find ALL workspace memberships for this user
            let allMemberships;
            try {
                allMemberships = await adminDatabases.listDocuments(
                    DATABASE_ID,
                    MEMBERS_ID,
                    [
                        Query.equal("userId", user.$id),
                        Query.limit(100),
                    ]
                );
            } catch {
                return c.json({
                    data: { documents: [], total: 0 },
                });
            }

            const activeMemberships = allMemberships.documents.filter(
                (m: Models.Document) => !m.deletedAt
            );

            if (activeMemberships.length === 0) {
                return c.json({
                    data: { documents: [], total: 0 },
                });
            }

            // 2. Fetch sprints for each workspace in parallel
            const allSprintArrays = await Promise.all(
                activeMemberships.map(async (member) => {
                    try {
                        const sprints = await adminDatabases.listDocuments<Sprint>(
                            DATABASE_ID,
                            SPRINTS_ID,
                            [
                                Query.equal("workspaceId", member.workspaceId),
                                Query.orderDesc("$createdAt"),
                                Query.limit(100),
                            ]
                        );
                        return sprints.documents;
                    } catch {
                        return [];
                    }
                })
            );

            const mergedSprints = allSprintArrays.flat();

            // 3. Populate project info for each sprint
            const projectIds = Array.from(new Set(mergedSprints.map(s => s.projectId)));
            const projectMap = new Map<string, Project>();

            if (projectIds.length > 0) {
                try {
                    const projects = await adminDatabases.listDocuments<Project>(
                        DATABASE_ID,
                        PROJECTS_ID,
                        [
                            Query.equal("$id", projectIds),
                            Query.limit(projectIds.length),
                        ]
                    );

                    projects.documents.forEach(p => projectMap.set(p.$id, p));
                } catch {
                    // Fail gracefully
                }
            }

            const populatedSprints: PopulatedSprint[] = mergedSprints.map(sprint => ({
                ...sprint,
                project: projectMap.get(sprint.projectId) || null,
            } as PopulatedSprint));

            return c.json({
                data: {
                    documents: populatedSprints,
                    total: populatedSprints.length,
                },
            });
        }
    )
    .get(
        "/members",
        sessionMiddleware,
        async (c) => {
            const { databases: adminDatabases, users } = await createAdminClient();
            const user = c.get("user");

            // 1. Find ALL workspace memberships for this user
            let allMemberships;
            try {
                allMemberships = await adminDatabases.listDocuments(
                    DATABASE_ID,
                    MEMBERS_ID,
                    [
                        Query.equal("userId", user.$id),
                        Query.limit(100),
                    ]
                );
            } catch {
                return c.json({
                    data: { documents: [], total: 0 },
                });
            }

            const activeMemberships = allMemberships.documents.filter(
                (m: Models.Document) => !m.deletedAt
            );

            if (activeMemberships.length === 0) {
                return c.json({
                    data: { documents: [], total: 0 },
                });
            }

            // 2. Fetch members for each workspace in parallel
            const allMemberArrays = await Promise.all(
                activeMemberships.map(async (membership) => {
                    try {
                        const members = await adminDatabases.listDocuments(
                            DATABASE_ID,
                            MEMBERS_ID,
                            [
                                Query.equal("workspaceId", membership.workspaceId),
                                Query.limit(100),
                            ]
                        );
                        return members.documents;
                    } catch {
                        return [];
                    }
                })
            );

            const mergedMembers = allMemberArrays.flat();

            // 3. De-duplicate members by userId (since one user might be in multiple workspaces)
            // and populate with actual auth user data
            const uniqueUserIds = Array.from(new Set(mergedMembers.map(m => m.userId as string)));
            const userMap = await batchGetUsers(users, uniqueUserIds);

            const uniqueMembers = Array.from(new Map(
                mergedMembers.map(m => [m.userId, m])
            ).values());

            const populatedMembers = uniqueMembers.map(m => {
                const member = m as Member;
                const userData = userMap.get(member.userId as string);
                return {
                    ...member,
                    name: userData?.name || member.name || member.email,
                    email: member.email,
                    profileImageUrl: userData?.prefs?.profileImageUrl || member.profileImageUrl || null,
                };
            });

            return c.json({
                data: {
                    documents: populatedMembers,
                    total: populatedMembers.length,
                }
            });
        }
    )
    .get(
        "/activity-logs",
        sessionMiddleware,
        async (c) => {
            const { databases: adminDatabases } = await createAdminClient();
            const user = c.get("user");

            // 1. Find ALL active workspace memberships
            let allMemberships;
            try {
                allMemberships = await adminDatabases.listDocuments(
                    DATABASE_ID,
                    MEMBERS_ID,
                    [
                        Query.equal("userId", user.$id),
                        Query.limit(100),
                    ]
                );
            } catch {
                return c.json({ data: [] });
            }

            const activeMemberships = allMemberships.documents.filter(
                (m: Models.Document) => !m.deletedAt
            );

            if (activeMemberships.length === 0) {
                return c.json({ data: [] });
            }

            // 2. Fetch recent activity for each workspace in parallel
            const limit = parseInt(c.req.query("limit") || "10");

            const allActivityArrays = await Promise.all(
                activeMemberships.map(async (membership) => {
                    try {
                        const { activities } = await getActivityLogs({
                            workspaceId: membership.workspaceId,
                            limit: limit,
                        });
                        return activities;
                    } catch (err) {
                        console.error(`Failed to fetch activity logs for workspace ${membership.workspaceId}:`, err);
                        return [];
                    }
                })
            );

            const mergedActivities = allActivityArrays.flat();

            // De-duplicate activities by ID to prevent key errors
            const uniqueActivities = Array.from(new Map(
                mergedActivities.map(activity => [activity.id, activity])
            ).values());

            // Sort by timestamp descending
            uniqueActivities.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // Enrichment with descriptions (if not already done by getActivityLogs)
            const finalActivities = uniqueActivities.slice(0, limit).map(activity => ({
                ...activity,
                description: formatActivityDescription(activity),
            }));

            return c.json({
                data: finalActivities,
            });
        }
    );

export default app;
