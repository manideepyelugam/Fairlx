"use client";

import { LoaderIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";

import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useProjectPermissions } from "@/hooks/use-project-permissions";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

import { ColumnDef } from "@tanstack/react-table";

// Dynamically import heavy view components
const DataTable = dynamic(() => import("./data-table").then(mod => mod.DataTable), {
  loading: () => <div className="h-[400px] animate-pulse p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-muted/40 rounded-lg" />)}</div>,
}) as React.ComponentType<{ columns: ColumnDef<PopulatedTask, unknown>[]; data: PopulatedTask[] }>;

const DataCalendar = dynamic(() => import("./data-calendar").then(mod => mod.DataCalendar), {
  loading: () => <div className="h-[400px] animate-pulse p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-muted/40 rounded-lg" />)}</div>,
});

const EnhancedDataKanban = dynamic(() => import("@/features/custom-columns/components/enhanced-data-kanban").then(mod => mod.EnhancedDataKanban), {
  loading: () => <div className="h-[400px] animate-pulse p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-muted/40 rounded-lg" />)}</div>,
});

const DataDashboard = dynamic(() => import("./data-dashboard").then(mod => mod.DataDashboard), {
  loading: () => <div className="h-[400px] animate-pulse p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-muted/40 rounded-lg" />)}</div>,
});

const TimelineView = dynamic(() => import("@/features/timeline/components/timeline-view").then(mod => mod.TimelineView), {
  loading: () => <div className="h-[400px] animate-pulse p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-muted/40 rounded-lg" />)}</div>,
});

const MyBacklogView = dynamic(() => import("@/features/personal-backlog/components/my-backlog-view").then(mod => mod.MyBacklogView), {
  loading: () => <div className="h-[400px] animate-pulse p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-muted/40 rounded-lg" />)}</div>,
});

const EnhancedBacklogScreen = dynamic(() => import("@/features/sprints/components/enhanced-backlog-screen"), {
  loading: () => <div className="h-[400px] animate-pulse p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-muted/40 rounded-lg" />)}</div>,
});

import { createColumns } from "./columns";
import { DataFilters } from "./data-filters";
import { ProjectSetupOverlay } from "@/features/sprints/components/project-setup-overlay";
import { useGetWorkItems } from "@/features/sprints/api/use-get-work-items";
import { useGetSprints } from "@/features/sprints/api/use-get-sprints";
import { useBulkUpdateWorkItems } from "@/features/sprints/api/use-bulk-update-work-items";
import { SprintStatus, WorkItemStatus, WorkItemPriority, PopulatedWorkItem } from "@/features/sprints/types";
import { CompleteSprintModal } from "@/features/sprints/components/complete-sprint-modal";
import { CreateWorkItemModal } from "@/features/sprints/components/create-work-item-modal";

import { useTaskFilters } from "../hooks/use-task-filters";
import { TaskStatus, TaskPriority, PopulatedTask } from "../types";

// Custom sliding TabsList for this component only
interface SlidingTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  children: React.ReactNode;
}

const SlidingTabsList = ({ className, children, ...props }: SlidingTabsListProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({
    width: 0,
    transform: "translateX(0px)",
    opacity: 0,
  });

  useEffect(() => {
    const updateIndicator = () => {
      const list = listRef.current;
      if (!list) return;

      const activeTab = list.querySelector('[data-state="active"]') as HTMLElement;
      if (activeTab) {
        const listRect = list.getBoundingClientRect();
        const activeRect = activeTab.getBoundingClientRect();

        setIndicatorStyle({
          width: activeRect.width,
          transform: `translateX(${activeRect.left - listRect.left}px)`,
          opacity: 1,
        });
      }
    };

    updateIndicator();

    const list = listRef.current;
    if (list) {
      const observer = new MutationObserver(updateIndicator);
      observer.observe(list, {
        attributes: true,
        attributeFilter: ["data-state"],
        subtree: true,
      });

      window.addEventListener("resize", updateIndicator);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", updateIndicator);
      };
    }
  }, [children]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      className={cn(
        "relative inline-flex h-9 items-center justify-center rounded-lg p-1",
        className
      )}
      {...props}
    >
      {/* Sliding indicator */}
      <span
        className="absolute top-1 left-0 h-[calc(100%-8px)] rounded-md bg-blue-600 shadow-sm transition-all duration-300 ease-out"
        style={indicatorStyle}
      />
      {/* Tab triggers with relative positioning */}
      <span className="relative z-10 inline-flex items-center gap-x-1">
        {children}
      </span>
    </TabsPrimitive.List>
  );
};

// Custom TabsTrigger for this component with specific colors
const SlidingTabsTrigger = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      "text-foreground data-[state=active]:text-white",
      className
    )}
    {...props}
  />
);

// Map WorkItemStatus to TaskStatus for compatibility with existing components
// For custom column IDs (strings not in the default map), pass them through directly
const workItemStatusToTaskStatus = (status: WorkItemStatus | string): TaskStatus | string => {
  const statusMap: Record<WorkItemStatus, TaskStatus> = {
    [WorkItemStatus.TODO]: TaskStatus.TODO,
    [WorkItemStatus.ASSIGNED]: TaskStatus.ASSIGNED,
    [WorkItemStatus.IN_PROGRESS]: TaskStatus.IN_PROGRESS,
    [WorkItemStatus.IN_REVIEW]: TaskStatus.IN_REVIEW,
    [WorkItemStatus.DONE]: TaskStatus.DONE,
  };
  // If it's a known WorkItemStatus, map it; otherwise, pass through as-is (custom column ID)
  return statusMap[status as WorkItemStatus] ?? status;
};

// Map TaskStatus to WorkItemStatus for saving
// For custom column IDs (strings that aren't in the default map), pass them through directly
const taskStatusToWorkItemStatus = (status: TaskStatus | string): WorkItemStatus | string => {
  const statusMap: Record<TaskStatus, WorkItemStatus> = {
    [TaskStatus.TODO]: WorkItemStatus.TODO,
    [TaskStatus.ASSIGNED]: WorkItemStatus.ASSIGNED,
    [TaskStatus.IN_PROGRESS]: WorkItemStatus.IN_PROGRESS,
    [TaskStatus.IN_REVIEW]: WorkItemStatus.IN_REVIEW,
    [TaskStatus.DONE]: WorkItemStatus.DONE,
  };
  // If it's a known TaskStatus, map it; otherwise, pass it through as-is (custom column ID)
  return statusMap[status as TaskStatus] ?? status;
};

/**
 * Convert WorkItem to Task format for existing components.
 * 
 * IMPORTANT: This is a data normalization boundary. We defensively filter out
 * invalid relation data here to prevent runtime crashes from:
 * - Deleted users (tombstoned but still referenced in assigneeIds)
 * - Permission-masked relations (user lacks read access to assignee)
 * - Legacy data inconsistencies (partial population from backend)
 * 
 * Optional chaining (?.map) does NOT protect against null items inside arrays.
 * We must explicitly filter before mapping to ensure type safety.
 */
const workItemToTask = (workItem: PopulatedWorkItem): PopulatedTask => {
  // Filter out null/undefined assignees before mapping.
  // This handles cases where the assignees array contains invalid entries
  // (e.g., deleted users, permission-masked relations, legacy data).
  const safeAssignees = workItem.assignees
    ?.filter((a): a is NonNullable<typeof a> => a != null && typeof a.$id === "string")
    .map(a => ({
      $id: a.$id,
      name: a.name ?? "", // Fallback for missing name
      email: a.email,
      profileImageUrl: a.profileImageUrl,
    }));

  // Safely extract the first valid assignee ID for backward compatibility.
  // Prefer assigneeIds array, but validate it exists and has valid entries.
  const firstAssigneeId = workItem.assigneeIds?.find(id => typeof id === "string" && id.length > 0) ?? "";

  // Defensively populate project relation - it may be null, undefined,
  // or partially populated depending on backend state.
  const safeProject = workItem.project && typeof workItem.project.$id === "string"
    ? {
      $id: workItem.project.$id,
      name: workItem.project.name ?? "",
      imageUrl: workItem.project.imageUrl ?? "",
    }
    : undefined;

  return {
    $id: workItem.$id,
    $collectionId: workItem.$collectionId,
    $databaseId: workItem.$databaseId,
    $createdAt: workItem.$createdAt,
    $updatedAt: workItem.$updatedAt,
    $permissions: workItem.$permissions,
    title: workItem.title,
    name: workItem.title,
    type: workItem.type || "TASK", // Include work item type with fallback
    status: workItemStatusToTaskStatus(workItem.status),
    workspaceId: workItem.workspaceId,
    assigneeId: firstAssigneeId,
    assigneeIds: workItem.assigneeIds ?? [],
    projectId: workItem.projectId,
    sprintId: workItem.sprintId,
    position: workItem.position,
    dueDate: workItem.dueDate || new Date().toISOString(),
    endDate: workItem.dueDate,
    description: workItem.description,
    estimatedHours: workItem.estimatedHours,
    priority: workItem.priority as unknown as TaskPriority,
    labels: workItem.labels,
    flagged: workItem.flagged,
    assignees: safeAssignees,
    project: safeProject,
  };
};

interface TaskViewSwitcherProps {
  hideProjectFilter?: boolean;
  showMyTasksOnly?: boolean; // New prop to filter by current user
}

export const TaskViewSwitcher = ({
  hideProjectFilter,
  showMyTasksOnly = false,
}: TaskViewSwitcherProps) => {


  const [{ status, assigneeId, projectId, search, priority }] =
    useTaskFilters();
  const [view, setView] = useQueryState("task-view", { defaultValue: "dashboard" });
  const [completeSprintOpen, setCompleteSprintOpen] = useState(false);
  const { mutate: bulkUpdate } = useBulkUpdateWorkItems();

  const workspaceId = useWorkspaceId();
  const paramProjectId = useProjectId();

  // Get current user data
  const { member: currentMember, isAdmin } = useCurrentMember({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });

  // Determine the effective assigneeId - if showMyTasksOnly is true, use current member's ID
  const effectiveAssigneeId = showMyTasksOnly && currentMember ? currentMember.$id : assigneeId;

  // Get effective project ID
  const effectiveProjectId = paramProjectId || projectId;

  // Get project-level task permissions
  const {
    canEditTasksProject,
    canDeleteTasksProject,
    canCreateTasksProject
  } = useProjectPermissions({ projectId: effectiveProjectId || null, workspaceId });

  // Effective permissions: Admin OR has project-level permission
  const canEditTasks = isAdmin || canEditTasksProject;
  const canDeleteTasks = isAdmin || canDeleteTasksProject;
  const canCreateTasks = isAdmin || canCreateTasksProject;

  // Use Work Items instead of Tasks - map status filter from TaskStatus to WorkItemStatus
  const mappedStatus = status ? taskStatusToWorkItemStatus(status as TaskStatus) : undefined;

  const { data: workItemsData, isLoading: isLoadingWorkItems } = useGetWorkItems({
    workspaceId,
    projectId: effectiveProjectId || undefined,
    assigneeId: effectiveAssigneeId || undefined,
    status: mappedStatus,
    priority: priority && priority !== "null" ? priority as unknown as WorkItemPriority : undefined,
    search: undefined, // Don't filter on server side, use client-side search
  });

  // Get sprints for setup overlay check (only when viewing a project)
  const { data: sprintsData } = useGetSprints({
    workspaceId,
    projectId: effectiveProjectId || undefined
  });

  // Convert work items to tasks format
  const tasks = useMemo(() => {
    if (!workItemsData?.documents) return undefined;
    return {
      documents: workItemsData.documents.map(workItemToTask),
      total: workItemsData.total || workItemsData.documents.length,
    };
  }, [workItemsData]);

  // Calculate setup state for Jira-like overlay
  const setupState = useMemo(() => {
    const workItems = workItemsData?.documents || [];
    const sprints = sprintsData?.documents || [];
    const activeSprint = sprints.find(s => s.status === SprintStatus.ACTIVE);

    return {
      hasWorkItems: workItems.length > 0,
      hasSprints: sprints.length > 0,
      hasActiveSprint: !!activeSprint,
      activeSprint,
      needsSetup: workItems.length === 0 || sprints.length === 0 || !activeSprint,
    };
  }, [workItemsData, sprintsData]);

  // Client-side filtering for search
  const filteredTasks = useMemo(() => {
    if (!tasks?.documents) return undefined;

    let filtered = tasks.documents;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(task =>
        (task.title || task.name || "").toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    return {
      ...tasks,
      documents: filtered,
      total: filtered.length
    };
  }, [tasks, search]);

  // Filter tasks for Kanban view to only show the active sprint
  const kanbanTasks = useMemo(() => {
    if (!filteredTasks?.documents) return [];

    const activeSprint = sprintsData?.documents?.find(s => s.status === SprintStatus.ACTIVE);

    // If we are in project view and have sprints, only show items from the active sprint
    // If not in project view or no active sprint, maybe show nothing or keep as is? 
    // The user said "in kanban only show active sprint workitems".
    if (effectiveProjectId) {
      if (!activeSprint) return []; // No active sprint = no items in Kanban
      return filteredTasks.documents.filter(task => task.sprintId === activeSprint.$id);
    }

    return filteredTasks.documents;
  }, [filteredTasks, sprintsData, effectiveProjectId]);



  const onKanbanChange = useCallback(
    (tasks: { $id: string; status: TaskStatus | string; position: number }[]) => {
      // Convert TaskStatus back to WorkItemStatus for saving
      const workItemUpdates = tasks.map(task => ({
        $id: task.$id,
        status: taskStatusToWorkItemStatus(task.status as TaskStatus),
        position: task.position,
      }));
      bulkUpdate({ json: { workItems: workItemUpdates } });
    },
    [bulkUpdate]
  );



  const isLoadingTasks = isLoadingWorkItems;


  return (
    <Tabs
      defaultValue={view}
      onValueChange={setView}
      className="flex-1 w-full border rounded-lg bg-card"
    >
      <div className="h-full flex flex-col overflow-auto ">
        <div className="flex flex-col gap-y-2  px-4 py-6 lg:flex-row justify-between items-center">
          <SlidingTabsList className="w-full lg:w-auto bg-muted/50 border border-border">
            <SlidingTabsTrigger className="h-8 w-full text-xs lg:w-auto" value="dashboard">
              {showMyTasksOnly ? "My Space" : "Dashboard"}
            </SlidingTabsTrigger>
            <SlidingTabsTrigger className="h-8 w-full text-xs lg:w-auto" value="table">
              Table
            </SlidingTabsTrigger>
            <SlidingTabsTrigger className="h-8 w-full text-xs lg:w-auto" value="kanban">
              Kanban
            </SlidingTabsTrigger>
            <SlidingTabsTrigger className="h-8 w-full text-xs lg:w-auto" value="calendar">
              Calendar
            </SlidingTabsTrigger>
            <SlidingTabsTrigger className="h-8 w-full text-xs lg:w-auto" value="timeline">
              Timeline
            </SlidingTabsTrigger>
            {paramProjectId && (
              <SlidingTabsTrigger className="h-8 w-full text-xs lg:w-auto" value="backlog">
                Backlog
              </SlidingTabsTrigger>
            )}
            {showMyTasksOnly && (
              <SlidingTabsTrigger className="h-8 w-full text-xs lg:w-auto" value="my-backlog">
                My Backlog
              </SlidingTabsTrigger>
            )}
          </SlidingTabsList>

          {isAdmin && view === "kanban" && setupState.activeSprint && (
            <Button
              onClick={() => setCompleteSprintOpen(true)}
              size="xs"
              variant="outline"
              className="w-full font-medium px-3 py-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:border-emerald-500/40 lg:w-auto dark:text-emerald-400"
            >
              Complete Sprint {setupState.activeSprint.name}
            </Button>
          )}

        </div>


      </div>


      {view !== "dashboard" && view !== "timeline" && view !== "backlog" && (
        <DataFilters
          hideProjectFilter={hideProjectFilter}
          showMyTasksOnly={showMyTasksOnly}
          disableManageColumns={effectiveProjectId ? setupState.needsSetup : false}
        />
      )}


      {isLoadingTasks ? (
        <div className="w-full border rounded-lg h-[200px] flex flex-col items-center justify-center">
          <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <TabsContent value="dashboard" className="mt-0 p-4">
            <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
              <DataDashboard tasks={filteredTasks?.documents} isLoading={isLoadingTasks} />
            </Suspense>
          </TabsContent>
          <TabsContent value="table" className="mt-0 p-4">
            {effectiveProjectId && setupState.needsSetup ? (
              <ProjectSetupOverlay
                workspaceId={workspaceId}
                projectId={effectiveProjectId}
                hasWorkItems={setupState.hasWorkItems}
                hasSprints={setupState.hasSprints}
                hasActiveSprint={setupState.hasActiveSprint}
                variant="table"
              >
                <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
                  <DataTable
                    columns={createColumns(canEditTasks, canDeleteTasks)}
                    data={filteredTasks?.documents ?? []}
                  />
                </Suspense>
              </ProjectSetupOverlay>
            ) : (
              <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
                <DataTable
                  columns={createColumns(canEditTasks, canDeleteTasks)}
                  data={filteredTasks?.documents ?? []}
                />
              </Suspense>
            )}
          </TabsContent>
          <TabsContent value="kanban" className="mt-0 p-4">
            {effectiveProjectId && setupState.needsSetup ? (
              <ProjectSetupOverlay
                workspaceId={workspaceId}
                projectId={effectiveProjectId}
                hasWorkItems={setupState.hasWorkItems}
                hasSprints={setupState.hasSprints}
                hasActiveSprint={setupState.hasActiveSprint}
                variant="kanban"
              >
                <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
                  <EnhancedDataKanban
                    data={kanbanTasks}
                    onChange={onKanbanChange}
                    canCreateTasks={canCreateTasks}
                    canEditTasks={canEditTasks}
                    canDeleteTasks={canDeleteTasks}
                    members={members?.documents ?? []}
                    projectId={paramProjectId || projectId || undefined}
                  />
                </Suspense>
              </ProjectSetupOverlay>
            ) : (
              <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
                <EnhancedDataKanban
                  data={kanbanTasks}
                  onChange={onKanbanChange}
                  canCreateTasks={canCreateTasks}
                  canEditTasks={canEditTasks}
                  canDeleteTasks={canDeleteTasks}
                  members={members?.documents ?? []}
                  projectId={paramProjectId || projectId || undefined}
                />
              </Suspense>
            )}
          </TabsContent>
          <TabsContent value="calendar" className="mt-0 h-full p-4 pb-4">
            {effectiveProjectId && setupState.needsSetup ? (
              <ProjectSetupOverlay
                workspaceId={workspaceId}
                projectId={effectiveProjectId}
                hasWorkItems={setupState.hasWorkItems}
                hasSprints={setupState.hasSprints}
                hasActiveSprint={setupState.hasActiveSprint}
                variant="calendar"
              >
                <Suspense fallback={<div className="h-[200px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
                  <DataCalendar data={filteredTasks?.documents ?? []} />
                </Suspense>
              </ProjectSetupOverlay>
            ) : (
              <Suspense fallback={<div className="h-[200px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
                <DataCalendar data={filteredTasks?.documents ?? []} />
              </Suspense>
            )}
          </TabsContent>
          <TabsContent value="timeline" className="mt-0 h-full">
            {effectiveProjectId && setupState.needsSetup ? (
              <ProjectSetupOverlay
                workspaceId={workspaceId}
                projectId={effectiveProjectId}
                hasWorkItems={setupState.hasWorkItems}
                hasSprints={setupState.hasSprints}
                hasActiveSprint={setupState.hasActiveSprint}
                variant="timeline"
              >
                <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
                  <TimelineView
                    workspaceId={workspaceId}
                    projectId={paramProjectId || projectId || undefined}
                  />
                </Suspense>
              </ProjectSetupOverlay>
            ) : (
              <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
                <TimelineView
                  workspaceId={workspaceId}
                  projectId={paramProjectId || projectId || undefined}
                />
              </Suspense>
            )}
          </TabsContent>
          {paramProjectId && (
            <TabsContent value="backlog" className="mt-0 h-full">
              <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
                <EnhancedBacklogScreen workspaceId={workspaceId} projectId={paramProjectId} />
              </Suspense>
            </TabsContent>
          )}
          {showMyTasksOnly && (
            <TabsContent value="my-backlog" className="mt-0 h-full">
              <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><LoaderIcon className="size-5 animate-spin text-muted-foreground" /></div>}>
                <MyBacklogView workspaceId={workspaceId} />
              </Suspense>
            </TabsContent>
          )}
        </>
      )}



      {
        setupState.activeSprint && (
          <CompleteSprintModal
            sprint={setupState.activeSprint}
            open={completeSprintOpen}
            onOpenChange={setCompleteSprintOpen}
          />
        )
      }
      <CreateWorkItemModal />
    </Tabs >
  );
};
