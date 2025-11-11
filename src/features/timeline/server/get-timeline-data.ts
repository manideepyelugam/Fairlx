import { Query } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, SPRINTS_ID, WORK_ITEMS_ID } from "@/config";
import { getMember } from "@/features/members/utils";
import { Sprint, WorkItem, PopulatedWorkItem, PopulatedSprint } from "@/features/sprints/types";
import { unstable_cache } from "next/cache";
import { TIMELINE_CONFIG } from "../config";

interface TimelineDataParams {
  workspaceId: string;
  projectId?: string;
}

interface TimelineData {
  sprints: {
    total: number;
    documents: PopulatedSprint[];
  };
  workItems: {
    total: number;
    documents: PopulatedWorkItem[];
  };
}

/**
 * Fetch timeline data on the server with proper authentication and caching
 * This prevents massive client-side data loading and potential crashes
 */
export async function getTimelineData(
  params: TimelineDataParams
): Promise<TimelineData | null> {
  const { workspaceId, projectId } = params;

  try {
    const { databases, account } = await createSessionClient();
    
    // Get current user
    const user = await account.get();

    // Verify membership
    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      throw new Error("Unauthorized access to workspace");
    }

    // Build queries
    const sprintQuery = [
      Query.equal("workspaceId", workspaceId),
      Query.orderAsc("position"),
      Query.limit(TIMELINE_CONFIG.limits.maxSprints),
    ];

    const workItemQuery = [
      Query.equal("workspaceId", workspaceId),
      Query.orderAsc("position"),
      Query.limit(TIMELINE_CONFIG.limits.maxWorkItems),
    ];

    // Only filter by projectId if explicitly provided
    if (projectId) {
      workItemQuery.push(Query.equal("projectId", projectId));
    }

    // Fetch data in parallel for better performance
    const [sprintsResponse, workItemsResponse] = await Promise.all([
      databases.listDocuments<Sprint>(DATABASE_ID, SPRINTS_ID, sprintQuery),
      databases.listDocuments<WorkItem>(DATABASE_ID, WORK_ITEMS_ID, workItemQuery),
    ]);

    // Populate sprint data with work item counts
    const populatedSprints = await Promise.all(
      sprintsResponse.documents.map(async (sprint) => {
        const sprintWorkItems = workItemsResponse.documents.filter(
          (item) => item.sprintId === sprint.$id
        );

        const totalPoints = sprintWorkItems.reduce(
          (sum, item) => sum + (item.storyPoints || 0),
          0
        );

        const completedPoints = sprintWorkItems
          .filter((item) => item.status === "DONE")
          .reduce((sum, item) => sum + (item.storyPoints || 0), 0);

        return {
          ...sprint,
          workItemCount: sprintWorkItems.length,
          totalPoints,
          completedPoints,
        };
      })
    );

    // Build a map of work items by ID for fast lookups
    const workItemMap = new Map(
      workItemsResponse.documents.map((item) => [item.$id, item])
    );

    // Populate work items with relationships (but don't fetch assignees yet to keep it fast)
    const populatedWorkItems: PopulatedWorkItem[] = workItemsResponse.documents.map((workItem) => {
      let epic = null;
      if (workItem.epicId && workItemMap.has(workItem.epicId)) {
        const epicDoc = workItemMap.get(workItem.epicId)!;
        epic = {
          $id: epicDoc.$id,
          key: epicDoc.key,
          title: epicDoc.title,
        };
      }

      let parent = null;
      if (workItem.parentId && workItemMap.has(workItem.parentId)) {
        const parentDoc = workItemMap.get(workItem.parentId)!;
        parent = {
          $id: parentDoc.$id,
          key: parentDoc.key,
          title: parentDoc.title,
        };
      }

      // Count children
      const childrenCount = workItemsResponse.documents.filter(
        (item) => item.parentId === workItem.$id
      ).length;

      // Get children for hierarchical display
      const children = workItemsResponse.documents
        .filter((item) => item.parentId === workItem.$id)
        .slice(0, TIMELINE_CONFIG.limits.maxChildren) // Limit children to prevent overload
        .map((child) => ({
          ...child,
          assignees: [], // Will be populated on demand
          epic: null,
          parent: {
            $id: workItem.$id,
            key: workItem.key,
            title: workItem.title,
          },
          childrenCount: 0,
        })) as PopulatedWorkItem[];

      return {
        ...workItem,
        assignees: [], // Assignees will be fetched on demand via client component
        epic,
        parent,
        childrenCount,
        children: children.length > 0 ? children : undefined,
      };
    });

    return {
      sprints: {
        total: sprintsResponse.total,
        documents: populatedSprints,
      },
      workItems: {
        total: workItemsResponse.total,
        documents: populatedWorkItems,
      },
    };
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    return null;
  }
}

/**
 * Cached version of timeline data fetch
 * Revalidates every 60 seconds to balance freshness with performance
 */
export async function getCachedTimelineData(params: TimelineDataParams) {
  return unstable_cache(
    async () => getTimelineData(params),
    [`timeline-data-${params.workspaceId}-${params.projectId || "all"}`],
    {
      revalidate: TIMELINE_CONFIG.cache.timelineDataTTL,
      tags: ["timeline", `workspace-${params.workspaceId}`],
    }
  )();
}
