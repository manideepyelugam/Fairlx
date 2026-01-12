"use client";

import Image from "next/image";
import Link from "next/link";

import { Navigation } from "./navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Projects } from "./projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { Spaces } from "./spaces";
import { Tools } from "./tools";
import { useAccountLifecycle } from "@/components/account-lifecycle-provider";

export const Sidebar = () => {
  const { lifecycleState: state, isRestrictedOrgMember } = useAccountLifecycle();
  const {
    hasWorkspace,
    hasOrg,
    activeWorkspaceId
  } = state;
  const urlWorkspaceId = useWorkspaceId();

  // Only show workspace content if we have a workspace ID (URL or global)
  const showWorkspaceContent = !!(urlWorkspaceId || activeWorkspaceId);

  // ============================================================
  // RESTRICTED ORG MEMBER: Hide ALL workspace UI
  // ============================================================
  if (isRestrictedOrgMember) {
    return (
      <aside className="h-full bg-neutral-50 w-full overflow-hidden border-r-[1.5px] border-neutral-200 flex flex-col">
        <div className="flex items-center w-full py-5 px-4 border-b-[1.5px] border-neutral-200 flex-shrink-0">
          <Link href="/welcome">
            <Image src="/Logo.png" className="object-contain" alt="logo" width={80} height={90} />
          </Link>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden p-4">
          <div className="text-center text-sm text-muted-foreground space-y-4">
            <p className="font-medium">Waiting for Access</p>
            <p>An admin will assign you to a workspace soon.</p>
            <Link
              href="/profile"
              className="inline-block mt-4 text-primary hover:underline"
            >
              Complete your profile →
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full bg-neutral-50 w-full overflow-hidden border-r-[1.5px] border-neutral-200 flex flex-col">
      <div className="flex items-center w-full py-5 px-4 border-b-[1.5px] border-neutral-200 flex-shrink-0">
        <Link href={hasWorkspace ? "/" : "/welcome"} >
          <Image src="/Logo.png" className="object-contain " alt="logo" width={80} height={90} />
        </Link>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden overflow-y-auto">
        {/* Navigation: Always shown for ORG accounts, or when workspaces exist for PERSONAL */}
        {(hasOrg || hasWorkspace) && (
          <Navigation hasWorkspaces={hasWorkspace} />
        )}

        {/* Workspace-scoped content: Only shown when a workspace is active AND not on an org route */}
        {showWorkspaceContent && (
          <>
            <Tools />
            <Projects />
            <Spaces />
          </>
        )}

        {/* Empty state: Only for PERSONAL accounts with no workspaces */}
        {!hasWorkspace && !hasOrg && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <p className="mb-2">No workspaces yet</p>
            <p>Create a workspace to get started</p>
          </div>
        )}

        {/* ORG OWNER/ADMIN with no workspaces - show guidance */}
        {!hasWorkspace && hasOrg && (
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


