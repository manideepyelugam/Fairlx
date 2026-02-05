"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  FileText,
  Github,
  Users2,
  UserPlus,
  Settings,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { useProjectPermissions } from "@/hooks/use-project-permissions";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectToolItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  /**
   * Function to check if user can see this tool.
   * If not provided, tool is visible when user has base project access.
   */
  canView?: () => boolean;
}

/**
 * ProjectTools Component
 * 
 * Displays project-scoped navigation tools in the sidebar when a project is selected.
 * 
 * FEATURES:
 * - Only shows when a project is selected (from URL params)
 * - RBAC-controlled: Tools are filtered based on user's project permissions
 * - Quick navigation between project features without going to project dashboard
 * 
 * RBAC RULES:
 * - Dashboard: Always visible (requires base project.view)
 * - Sprint Board: Requires sprint.view
 * - Backlog: Requires task.create
 * - Docs: Requires project.view
 * - AI Github: Requires project.view
 * - Teams: Requires team.manage or team.create or project.view
 * - Members: Requires member.invite or member.remove or project.view
 * - Audit Logs: Requires project.view or project.settings.manage
 * - Settings: Requires project.settings.manage
 */
export const ProjectTools = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const urlWorkspaceId = useWorkspaceId();
  const urlProjectId = useProjectId();

  // Get projectId from URL params (works globally, not just on project pages)
  const projectId = (params?.projectId as string) || urlProjectId;
  const workspaceId = urlWorkspaceId;

  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch project data
  const { data: project, isLoading: isLoadingProject } = useGetProject({
    projectId: projectId || "",
  });

  // Get workspace-level admin status (fallback for project access)
  const { isAdmin: isWorkspaceAdmin } = useCurrentMember({ workspaceId: workspaceId || "" });

  // Fetch user's project permissions using convenience methods
  const {
    canViewProject,
    canManageProjectSettings,
    canViewSprints,
    canViewSprintsProject,
    canManageTeams,
    canCreateTeams,
    canInviteMembers,
    canRemoveMembers,
    canViewProjectDocs,
    canViewMembers,
    isLoading: isLoadingPermissions,
    permissions,
    isProjectAdmin,
  } = useProjectPermissions({
    projectId: projectId || null,
    workspaceId,
  });

  // Workspace admins get full access to all project tools
  const hasFullAccess = isProjectAdmin || isWorkspaceAdmin;

  // User can view project if they have project-level permission OR are workspace admin
  const effectiveCanViewProject = canViewProject || isWorkspaceAdmin;
  const effectiveCanManageSettings = canManageProjectSettings || isWorkspaceAdmin;
  const effectiveCanViewDocs = canViewProjectDocs || effectiveCanViewProject || isWorkspaceAdmin;
  const effectiveCanViewMembers = canViewMembers || effectiveCanViewProject || isWorkspaceAdmin;
  // Effective sprint view permission: ProjectPermissionKey-based OR legacy OR admin
  const effectiveCanViewSprints = canViewSprintsProject || canViewSprints || isWorkspaceAdmin;

  // Define project tools with their permission checks
  const projectTools: ProjectToolItem[] = useMemo(() => [
    {
      id: "sprints",
      label: "Sprint Board",
      href: "/sprints",
      icon: <Layers className="size-4" />,
      canView: () => effectiveCanViewSprints,
    },
    {
      id: "docs",
      label: "Docs",
      href: "/docs",
      icon: <FileText className="size-4" />,
      canView: () => effectiveCanViewDocs,
    },
    {
      id: "github",
      label: "AI Github",
      href: "/github",
      icon: <Github className="size-4" />,
      canView: () => effectiveCanViewProject,
    },
    {
      id: "teams",
      label: "Teams",
      href: "/teams",
      icon: <Users2 className="size-4" />,
      canView: () => canManageTeams || canCreateTeams || effectiveCanViewProject,
    },
    {
      id: "members",
      label: "Members",
      href: "/members",
      icon: <UserPlus className="size-4" />,
      canView: () => canInviteMembers || canRemoveMembers || effectiveCanViewMembers,
    },
    {
      id: "settings",
      label: "Settings",
      href: "/settings",
      icon: <Settings className="size-4" />,
      canView: () => effectiveCanManageSettings,
    },
  ], [
    effectiveCanViewProject,
    effectiveCanManageSettings,
    effectiveCanViewDocs,
    effectiveCanViewMembers,
    effectiveCanViewSprints,
    canManageTeams,
    canCreateTeams,
    canInviteMembers,
    canRemoveMembers
  ]);

  // Filter tools based on user permissions
  const visibleTools = useMemo(() => {
    // If no project is selected, return empty
    if (!projectId) return [];

    // Still loading permissions - return empty (will show skeleton)
    if (isLoadingPermissions) return [];

    // Workspace admins or project admins can see everything
    if (hasFullAccess) {
      return projectTools;
    }

    // If user has no project permissions AND is not workspace admin, return empty
    if ((!permissions || permissions.length === 0) && !isWorkspaceAdmin) {
      return [];
    }

    return projectTools.filter((tool) => {
      // Check if user can view this tool
      if (tool.canView) {
        return tool.canView();
      }

      // Default: visible if user has base project access
      return effectiveCanViewProject;
    });
  }, [projectId, isLoadingPermissions, permissions, projectTools, hasFullAccess, isWorkspaceAdmin, effectiveCanViewProject]);

  // Don't render if no project is selected
  if (!projectId || !workspaceId) {
    return null;
  }

  // Loading state - show skeleton while loading project or permissions
  if (isLoadingProject) {
    return (
      <div className="flex flex-col px-3 py-2 border-t border-sidebar-border">
        <div className="flex items-center gap-2 pl-2 mb-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-1 pl-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Don't render if project not found
  if (!project) {
    return null;
  }

  // Show loading skeleton for permissions (project is loaded)
  if (isLoadingPermissions) {
    return (
      <div className="flex flex-col px-3 py-2 border-t border-sidebar-border">
        <div className="flex items-center gap-2 pl-2 mb-2">
          <ProjectAvatar
            name={project.name}
            image={project.imageUrl}
            className="size-5"
          />
          <span className="text-[13px] font-medium truncate max-w-[120px]">{project.name}</span>
        </div>
        <div className="space-y-1 pl-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Don't render if user has no access (no visible tools)
  if (visibleTools.length === 0) {
    return null;
  }

  const handleToolClick = (tool: ProjectToolItem) => {
    const basePath = `/workspaces/${workspaceId}/projects/${projectId}`;
    const fullHref = `${basePath}${tool.href}`;
    router.push(fullHref);
  };

  const isToolActive = (tool: ProjectToolItem): boolean => {
    const basePath = `/workspaces/${workspaceId}/projects/${projectId}`;
    const toolPath = `${basePath}${tool.href}`;

    // For dashboard (empty href), check exact match or if we're on the base project page
    if (tool.href === "") {
      return pathname === basePath || pathname === `${basePath}/`;
    }

    // For other tools, check if current path starts with tool path
    return pathname?.startsWith(toolPath) || false;
  };

  return (
    <div className="flex flex-col px-3 py-2 border-t border-sidebar-border">
      {/* Project Header with Toggle */}
      <div className="flex items-center mt-2  justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-[13px] tracking-normal font-medium pl-2 text-sidebar-foreground/90 hover:text-sidebar-foreground w-full"
        >
          <span className="flex items-center gap-1">
            {isExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </span>
          {/* <ProjectAvatar
            name={project.name}
            image={project.imageUrl}
            className="size-5"
          /> */}
          <span className="truncate max-w-[170px]" title={project.name}>
            {project.name} Project Tools
          </span>
        </button>
      </div>

      {/* Project Tools List */}
      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-0.5 mt-2 pl-4 pt-1">
          {visibleTools.map((tool) => {
            const isActive = isToolActive(tool);
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors w-full",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70"
                )}
              >
                <span className={cn(
                  "transition-colors",
                  isActive && "text-primary"
                )}>
                  {tool.icon}
                </span>
                <span className="truncate text-xs font-medium">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
