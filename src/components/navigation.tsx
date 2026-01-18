"use client";

import { cn } from "@/lib/utils";
import { Settings, FolderKanban, Users2, Calendar, Building2 } from "lucide-react";
import Link from "next/link";
import {
  GoCheckCircle,
  GoCheckCircleFill,
  GoHome,
  GoHomeFill,
} from "react-icons/go";

import { usePathname } from "next/navigation";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useAccountLifecycle } from "@/components/account-lifecycle-provider";
import { AppRouteKey, getOrgRouteKeys } from "@/lib/permissions/appRouteKeys";

/**
 * Navigation Component (Permission-Driven)
 * 
 * ARCHITECTURE:
 * - Routes are filtered by `allowedRouteKeys` received from server
 * - No client-side permission logic - just UI rendering
 * - If a route key is not in allowedRouteKeys, the route is hidden
 * 
 * INVARIANT:
 * - If user can SEE a navigation item, they CAN access the route
 * - Navigation visibility is purely based on allowedRouteKeys
 */

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

interface RouteConfig {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon: React.ComponentType<{ className?: string }>;
  /** Route key for permission-based filtering */
  routeKey: AppRouteKey;
  /** If true, route uses dashboard-level path (not workspace-prefixed) */
  orgRoute?: boolean;
  /** If true, requires active workspace context */
  workspaceScoped?: boolean;
}

/**
 * Navigation routes with their associated route keys
 */
const routes: RouteConfig[] = [
  {
    label: "Home",
    href: "",
    icon: GoHome,
    activeIcon: GoHomeFill,
    routeKey: AppRouteKey.WORKSPACE_HOME,
    workspaceScoped: true,
  },
  {
    label: "My Spaces",
    href: "/tasks",
    icon: GoCheckCircle,
    activeIcon: GoCheckCircleFill,
    routeKey: AppRouteKey.WORKSPACE_TASKS,
    workspaceScoped: true,
  },
  {
    label: "Programs",
    href: "/programs",
    icon: FolderKanban,
    activeIcon: FolderKanban,
    routeKey: AppRouteKey.WORKSPACE_PROGRAMS,
    workspaceScoped: true,
  },
  {
    label: "Teams",
    href: "/teams",
    icon: Users2,
    activeIcon: Users2,
    routeKey: AppRouteKey.WORKSPACE_TEAMS,
    workspaceScoped: true,
  },
  {
    label: "Timeline",
    href: "/timeline",
    icon: Calendar,
    activeIcon: Calendar,
    routeKey: AppRouteKey.WORKSPACE_TIMELINE,
    workspaceScoped: true,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    activeIcon: Settings,
    routeKey: AppRouteKey.WORKSPACE_SETTINGS,
    workspaceScoped: true,
  },
  {
    label: "Organization",
    href: "/organization",
    icon: Building2,
    activeIcon: Building2,
    routeKey: AppRouteKey.ORG_DASHBOARD,
    orgRoute: true, // Dashboard-level route
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export interface NavigationProps {
  /** Route keys the user is allowed to access (from server) */
  allowedRouteKeys?: AppRouteKey[];
  /** Whether user has any workspaces (for workspace-scoped routes) */
  hasWorkspaces?: boolean;
  /** Whether user has an org account */
  hasOrg?: boolean;
}

export const Navigation = ({
  allowedRouteKeys,
  hasWorkspaces = true,
  hasOrg = false,
}: NavigationProps) => {
  const urlWorkspaceId = useWorkspaceId();
  const { lifecycleState: state } = useAccountLifecycle();
  const { activeWorkspaceId, hasOrg: contextHasOrg, orgRole } = state;

  // Use props if provided, otherwise fall back to context
  const effectiveHasOrg = hasOrg || contextHasOrg;
  const selectedWorkspaceId = urlWorkspaceId || activeWorkspaceId;
  const projectId = useProjectId();
  const pathname = usePathname();

  // OWNER fallback: If allowedRouteKeys is undefined but user is OWNER, show org routes
  // This ensures OWNER always sees navigation even before API response
  const effectiveRouteKeys = allowedRouteKeys ?? (orgRole === "OWNER" ? getOrgRouteKeys() : undefined);

  // Filter routes based on allowed route keys
  const visibleRoutes = routes.filter((route: RouteConfig) => {
    // If effectiveRouteKeys is provided, use permission-based filtering
    if (effectiveRouteKeys) {
      // Check if route key is in allowed list
      if (!effectiveRouteKeys.includes(route.routeKey)) return false;
    }

    // Workspace-scoped routes require workspace context
    if (route.workspaceScoped && !hasWorkspaces) return false;

    // Org routes only show for org accounts
    if (route.orgRoute && !effectiveHasOrg) return false;

    return true;
  });

  return (
    <div className="p-3 border-neutral-200 flex-shrink-0">
      <ul className="flex flex-col ">
        {visibleRoutes.map((item) => {
          // Determine the correct href based on route type
          let fullHref: string;
          let isActive: boolean;

          if (item.orgRoute) {
            // Org-level routes: dashboard-level, no workspace prefix
            fullHref = item.href;
            isActive = pathname === item.href || pathname?.startsWith(item.href + "/") || false;
          } else {
            // Workspace-scoped routes require an ID
            if (!selectedWorkspaceId) return null;

            if (item.href === "/timeline") {
              // Timeline: pass workspaceId and projectId as search params for SSR
              fullHref = `/workspaces/${selectedWorkspaceId}${item.href}?workspaceId=${selectedWorkspaceId}${projectId ? `&projectId=${projectId}` : ""}`;
            } else {
              // Standard workspace-scoped routes
              fullHref = `/workspaces/${selectedWorkspaceId}${item.href}`;
            }
            isActive = pathname === `/workspaces/${selectedWorkspaceId}${item.href}`;
          }

          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <div key={item.routeKey}>
              <Link href={fullHref}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-md font-medium hover:bg-blue-100 hover:text-black transition text-neutral-500",
                    isActive && "bg-neutral-200 shadow-sm hover:opacity-100 text-primary"
                  )}
                >
                  <Icon className={cn("size-5 ", isActive && "text-primary")} />
                  <p className="text-[12px] tracking-tight font-medium">
                    {item.label}
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </ul>
    </div>
  );
};
