"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { useGetTask } from "@/features/tasks/api/use-get-task";
import { cn } from "@/lib/utils";

export const Breadcrumb = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  // Extract IDs from path segments - accounting for (dashboard) route group
  const workspaceIndex = pathSegments.findIndex(segment => segment === "workspaces") + 1;
  const workspaceId = pathSegments[workspaceIndex]; // workspaces/[workspaceId]/...
  const sectionType = pathSegments[workspaceIndex + 1]; // projects, tasks, time-tracking
  const itemId = pathSegments[workspaceIndex + 2]; // [projectId] or [taskId]

  // Only fetch if we have the required IDs
  const shouldFetchWorkspace = Boolean(workspaceId);
  const shouldFetchProject = Boolean(itemId && sectionType === "projects");
  const shouldFetchTask = Boolean(itemId && sectionType === "tasks");

  // Fetch data based on the current route
  const { data: workspace } = useGetWorkspace({
    workspaceId,
    enabled: shouldFetchWorkspace,
  });
  
  const { data: project } = useGetProject({
    projectId: shouldFetchProject ? itemId : undefined,
    enabled: shouldFetchProject,
  });
  
  const { data: task } = useGetTask({
    taskId: shouldFetchTask ? itemId : undefined,
    enabled: shouldFetchTask,
  });

  // Don't render if we're not in a workspace route
  if (!shouldFetchWorkspace || !workspace) return null;

  const breadcrumbs: Array<{ label: string; href?: string }> = [];

  // Add workspace if we have one
  if (workspace) {
    breadcrumbs.push({
      label: workspace.name,
      href: `/workspaces/${workspaceId}`,
    });
  }

  // Add section based on route
  if (sectionType === "projects") {
    breadcrumbs.push({
      label: "Projects",
      href: `/workspaces/${workspaceId}/projects`,
    });
    
    if (project && itemId) {
      breadcrumbs.push({
        label: project.name,
        href: `/workspaces/${workspaceId}/projects/${itemId}`,
      });
    }
  } else if (sectionType === "tasks") {
    breadcrumbs.push({
      label: "Tasks",
      href: `/workspaces/${workspaceId}/tasks`,
    });
    
    if (task && itemId) {
      breadcrumbs.push({
        label: task.name,
        href: `/workspaces/${workspaceId}/tasks/${itemId}`,
      });
    }
  } else if (sectionType === "time-tracking") {
    breadcrumbs.push({
      label: "Time Tracking",
      href: `/workspaces/${workspaceId}/time-tracking`,
    });
  }

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/60" />
          )}
          {breadcrumb.href && index < breadcrumbs.length - 1  ? (
            <Link
  href={breadcrumb.label !== "Projects" ? breadcrumb.href : "#"}
  className={cn(
    "text-xs transition-colors truncate max-w-32",
    breadcrumb.label !== "Projects"
      ? "hover:text-foreground cursor-pointer"
      : "text-muted-foreground cursor-default"
  )}
>
  {breadcrumb.label}
</Link>
    
          ) : (
            <span className="text-foreground text-xs font-medium truncate max-w-32">
              {breadcrumb.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};