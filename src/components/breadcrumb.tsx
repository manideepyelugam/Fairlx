"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { useGetTask } from "@/features/tasks/api/use-get-task";
import { useGetTeam } from "@/features/teams/api/use-get-team";
import { useGetSpace } from "@/features/spaces/api/use-get-space";
import { useGetSprint } from "@/features/sprints/api/use-get-sprint";
import { useGetProgram } from "@/features/programs/api/use-get-program";
import { cn } from "@/lib/utils";

// Map section types to their display labels
const sectionLabels: Record<string, string> = {
  "projects": "Projects",
  "tasks": "Tasks",
  "time-tracking": "Time Tracking",
  "teams": "Teams",
  "spaces": "Spaces",
  "sprints": "Sprints",
  "programs": "Programs",
  "members": "Members",
  "my-backlog": "My Backlog",
  "audit-logs": "Audit Logs",
  "timeline": "Timeline",
  "settings": "Settings",
  "join": "Join",
  "backlog": "Backlog",
  "docs": "Docs",
  "github": "GitHub",
  "workflows": "Workflows",
  "accountinfo": "Account Info",
  "password": "Password",
};

export const Breadcrumb = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  // Handle profile routes
  const isProfileRoute = pathSegments[0] === "profile";
  
  // Extract IDs from path segments - accounting for (dashboard) route group
  const workspaceIndex = pathSegments.findIndex(segment => segment === "workspaces") + 1;
  const workspaceId = pathSegments[workspaceIndex]; // workspaces/[workspaceId]/...
  const sectionType = pathSegments[workspaceIndex + 1]; // projects, tasks, time-tracking, etc.
  const itemId = pathSegments[workspaceIndex + 2]; // [projectId], [taskId], [teamId], etc.
  const subSection = pathSegments[workspaceIndex + 3]; // backlog, sprints, docs, settings, etc.
  const subItemId = pathSegments[workspaceIndex + 4]; // nested item IDs if any

  // Only fetch if we have the required IDs
  const shouldFetchWorkspace = Boolean(workspaceId);
  const shouldFetchProject = Boolean(itemId && sectionType === "projects");
  const shouldFetchTask = Boolean(itemId && sectionType === "tasks");
  const shouldFetchTeam = Boolean(itemId && sectionType === "teams");
  const shouldFetchSpace = Boolean(itemId && sectionType === "spaces");
  const shouldFetchSprint = Boolean(
    (sectionType === "sprints" && itemId) || 
    (subSection === "sprints" && subItemId)
  );
  const shouldFetchProgram = Boolean(itemId && sectionType === "programs");

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

  const { data: team } = useGetTeam({
    teamId: shouldFetchTeam ? itemId : null,
  });

  const { data: space } = useGetSpace({
    spaceId: shouldFetchSpace ? itemId : "",
  });

  const { data: sprint } = useGetSprint({
    sprintId: shouldFetchSprint 
      ? (sectionType === "sprints" ? itemId : subItemId) || ""
      : "",
  });

  const { data: program } = useGetProgram({
    programId: shouldFetchProgram ? itemId : "",
  });

  // Handle profile routes
  if (isProfileRoute) {
    const profileSection = pathSegments[1];
    const breadcrumbs: Array<{ label: string; href?: string; isClickable?: boolean }> = [
      { label: "Profile", href: "/profile", isClickable: true },
    ];
    
    if (profileSection && sectionLabels[profileSection]) {
      breadcrumbs.push({
        label: sectionLabels[profileSection],
        href: `/profile/${profileSection}`,
        isClickable: true,
      });
    }

    return renderBreadcrumbs(breadcrumbs);
  }

  // Don't render if we're not in a workspace route
  if (!shouldFetchWorkspace || !workspace) return null;

  const breadcrumbs: Array<{ label: string; href?: string; isClickable?: boolean }> = [];

  // Add workspace if we have one
  if (workspace) {
    breadcrumbs.push({
      label: workspace.name,
      href: `/workspaces/${workspaceId}`,
      isClickable: true,
    });
  }

  // Add section based on route
  if (sectionType === "projects") {
    breadcrumbs.push({
      label: "Projects",
      href: `/workspaces/${workspaceId}/projects`,
      isClickable: false, // Projects list page might not exist as a standalone page
    });
    
    if (project && itemId) {
      breadcrumbs.push({
        label: project.name,
        href: `/workspaces/${workspaceId}/projects/${itemId}`,
        isClickable: true,
      });

      // Handle project sub-sections
      if (subSection) {
        const subSectionLabel = sectionLabels[subSection] || subSection;
        breadcrumbs.push({
          label: subSectionLabel,
          href: `/workspaces/${workspaceId}/projects/${itemId}/${subSection}`,
          isClickable: true,
        });

        // Handle nested items within project sub-sections (e.g., specific sprint within project sprints)
        if (subItemId && subSection === "sprints" && sprint) {
          breadcrumbs.push({
            label: sprint.name,
            href: `/workspaces/${workspaceId}/projects/${itemId}/sprints/${subItemId}`,
            isClickable: true,
          });
        }
      }
    }
  } else if (sectionType === "tasks") {
    // For individual task pages, show the project path instead of "Tasks"
    if (task && itemId && task.project) {
      breadcrumbs.push({
        label: "Projects",
        href: `/workspaces/${workspaceId}/projects`,
        isClickable: false,
      });
      
      breadcrumbs.push({
        label: task.project.name,
        href: `/workspaces/${workspaceId}/projects/${task.projectId}`,
        isClickable: true,
      });
      
      breadcrumbs.push({
        label: task.name,
        href: `/workspaces/${workspaceId}/tasks/${itemId}`,
        isClickable: true,
      });
    } else {
      // Fallback for tasks list page or tasks without project
      breadcrumbs.push({
        label: "Tasks",
        href: `/workspaces/${workspaceId}/tasks`,
        isClickable: true,
      });
      
      if (task && itemId) {
        breadcrumbs.push({
          label: task.name,
          href: `/workspaces/${workspaceId}/tasks/${itemId}`,
          isClickable: true,
        });
      }
    }
  } else if (sectionType === "teams") {
    breadcrumbs.push({
      label: "Teams",
      href: `/workspaces/${workspaceId}/teams`,
      isClickable: true,
    });
    
    if (team && itemId) {
      breadcrumbs.push({
        label: team.name,
        href: `/workspaces/${workspaceId}/teams/${itemId}`,
        isClickable: true,
      });
    }
  } else if (sectionType === "spaces") {
    breadcrumbs.push({
      label: "Spaces",
      href: `/workspaces/${workspaceId}/spaces`,
      isClickable: true,
    });
    
    if (space && itemId) {
      breadcrumbs.push({
        label: space.name,
        href: `/workspaces/${workspaceId}/spaces/${itemId}`,
        isClickable: true,
      });

      // Handle space sub-sections (e.g., workflows)
      if (subSection) {
        const subSectionLabel = sectionLabels[subSection] || subSection;
        breadcrumbs.push({
          label: subSectionLabel,
          href: `/workspaces/${workspaceId}/spaces/${itemId}/${subSection}`,
          isClickable: true,
        });
      }
    }
  } else if (sectionType === "sprints") {
    breadcrumbs.push({
      label: "Sprints",
      href: `/workspaces/${workspaceId}/sprints`,
      isClickable: true,
    });
    
    if (sprint && itemId) {
      breadcrumbs.push({
        label: sprint.name,
        href: `/workspaces/${workspaceId}/sprints/${itemId}`,
        isClickable: true,
      });
    }
  } else if (sectionType === "programs") {
    breadcrumbs.push({
      label: "Programs",
      href: `/workspaces/${workspaceId}/programs`,
      isClickable: true,
    });
    
    if (program && itemId) {
      breadcrumbs.push({
        label: program.name,
        href: `/workspaces/${workspaceId}/programs/${itemId}`,
        isClickable: true,
      });
    }
  } else if (sectionType === "time-tracking") {
    breadcrumbs.push({
      label: "Time Tracking",
      href: `/workspaces/${workspaceId}/time-tracking`,
      isClickable: true,
    });
  } else if (sectionType === "members") {
    breadcrumbs.push({
      label: "Members",
      href: `/workspaces/${workspaceId}/members`,
      isClickable: true,
    });
  } else if (sectionType === "my-backlog") {
    breadcrumbs.push({
      label: "My Backlog",
      href: `/workspaces/${workspaceId}/my-backlog`,
      isClickable: true,
    });
  } else if (sectionType === "audit-logs") {
    breadcrumbs.push({
      label: "Audit Logs",
      href: `/workspaces/${workspaceId}/audit-logs`,
      isClickable: true,
    });
  } else if (sectionType === "timeline") {
    breadcrumbs.push({
      label: "Timeline",
      href: `/workspaces/${workspaceId}/timeline`,
      isClickable: true,
    });
  } else if (sectionType === "settings") {
    breadcrumbs.push({
      label: "Settings",
      href: `/workspaces/${workspaceId}/settings`,
      isClickable: true,
    });
  } else if (sectionType === "join") {
    breadcrumbs.push({
      label: "Join Workspace",
      href: `/workspaces/${workspaceId}/join`,
      isClickable: true,
    });
  }

  if (breadcrumbs.length === 0) return null;

  return renderBreadcrumbs(breadcrumbs);
};

function renderBreadcrumbs(breadcrumbs: Array<{ label: string; href?: string; isClickable?: boolean }>) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/60" />
          )}
          {breadcrumb.href && breadcrumb.isClickable && index < breadcrumbs.length - 1 ? (
            <Link
              href={breadcrumb.href}
              className={cn(
                "text-xs transition-colors truncate max-w-32",
                "hover:text-foreground cursor-pointer"
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
}