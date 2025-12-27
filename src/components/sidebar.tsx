"use client";

import Image from "next/image";
import Link from "next/link";

import { Navigation } from "./navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Projects } from "./projects";
import { Spaces } from "./spaces";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useAccountType } from "@/features/organizations/hooks/use-account-type";

export const Sidebar = () => {
  const { data: workspaces } = useGetWorkspaces();
  const workspaceId = useWorkspaceId();
  const { isOrg } = useAccountType();

  const hasWorkspaces = workspaces && workspaces.total > 0;
  const hasActiveWorkspace = hasWorkspaces && !!workspaceId;

  return (
    <aside className="h-full bg-neutral-50 w-full overflow-hidden border-r-[1.5px] border-neutral-200 flex flex-col">
      <div className="flex items-center w-full py-5 px-4 border-b-[1.5px] border-neutral-200 flex-shrink-0">
        <Link href={hasWorkspaces ? "/" : "/welcome"} >
          <Image src="/Logo.png" className="object-contain " alt="logo" width={80} height={90} />
        </Link>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden overflow-y-auto">
        {/* Navigation: Always shown for ORG accounts, or when workspaces exist for PERSONAL */}
        {(isOrg || hasWorkspaces) && (
          <Navigation hasWorkspaces={hasWorkspaces} />
        )}

        {/* Workspace-scoped content: Only shown when a workspace is actively selected */}
        {hasActiveWorkspace && (
          <>
            <Projects />
            <Spaces />
          </>
        )}

        {/* Empty state: Only for PERSONAL accounts with no workspaces */}
        {!hasWorkspaces && !isOrg && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <p className="mb-2">No workspaces yet</p>
            <p>Create a workspace to get started</p>
          </div>
        )}

        {/* ORG accounts with no workspaces - show guidance */}
        {!hasWorkspaces && isOrg && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <p className="mb-2">Ready to start</p>
            <p>Create a workspace or manage your organization</p>
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        <WorkspaceSwitcher />
      </div>
    </aside>
  );
};

