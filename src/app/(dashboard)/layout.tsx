'use client';
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import all modals to keep the main bundle light
const CreateProjectModal = dynamic(() => import("@/features/projects/components/create-project-modal").then(mod => mod.CreateProjectModal), { ssr: false });
const CreateWorkspaceModal = dynamic(() => import("@/features/workspaces/components/create-workspace-modal").then(mod => mod.CreateWorkspaceModal), { ssr: false });
const CreateWorkItemModal = dynamic(() => import("@/features/sprints/components/create-work-item-modal").then(mod => mod.CreateWorkItemModal), { ssr: false });
const CreateCustomColumnModalWrapper = dynamic(() => import("@/features/custom-columns/components/create-custom-column-modal-wrapper").then(mod => mod.CreateCustomColumnModalWrapper), { ssr: false });
const ManageColumnsModalWrapper = dynamic(() => import("@/features/custom-columns/components/manage-columns-modal-wrapper").then(mod => mod.ManageColumnsModalWrapper), { ssr: false });
const CreateProgramModal = dynamic(() => import("@/features/programs/components/create-program-modal").then(mod => mod.CreateProgramModal), { ssr: false });
const EditProgramModal = dynamic(() => import("@/features/programs/components/edit-program-modal").then(mod => mod.EditProgramModal), { ssr: false });
const ProjectAIChatWrapper = dynamic(() => import("@/features/project-docs/components").then(mod => mod.ProjectAIChatWrapper), { ssr: false });
const CreateSpaceModal = dynamic(() => import("@/features/spaces/components").then(mod => mod.CreateSpaceModal), { ssr: false });
const CreateWorkflowModal = dynamic(() => import("@/features/workflows/components/create-workflow-modal").then(mod => mod.CreateWorkflowModal), { ssr: false });
const CreateLinkModal = dynamic(() => import("@/features/work-item-links/components/create-link-modal").then(mod => mod.CreateLinkModal), { ssr: false });
const CreateTaskModal = dynamic(() => import("@/features/tasks/components/create-task-modal").then(mod => mod.CreateTaskModal), { ssr: false });
const EditTaskModal = dynamic(() => import("@/features/tasks/components/edit-task-modal").then(mod => mod.EditTaskModal), { ssr: false });
const TaskDetailsModalWrapper = dynamic(() => import("@/features/tasks/components/task-details-modal-wrapper").then(mod => mod.TaskDetailsModalWrapper), { ssr: false });
const TaskPreviewModalWrapper = dynamic(() => import("@/features/tasks/components/task-preview-modal").then(mod => mod.TaskPreviewModalWrapper), { ssr: false });
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { useAccountLifecycle } from "@/components/account-lifecycle-provider";
import { LifecycleGuard } from "@/components/lifecycle-guard";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Inner layout component that renders the actual dashboard content.
 * Guarded by LifecycleGuard - this only renders when lifecycle state is valid.
 */
const DashboardContent = ({ children }: DashboardLayoutProps) => {
  const pathname = usePathname();
  const isProfilePage = pathname === "/profile" || pathname.startsWith("/profile/");
  const workspaceId = useWorkspaceId();
  const isTaskDetailPage = /^\/workspaces\/[^\/]+\/tasks\/[^\/]+$/.test(pathname || "");
  const isMainDashboard = /^\/workspaces\/[^\/]+$/.test(pathname || "");
  const { isLoaded } = useAccountLifecycle();

  // Don't render until lifecycle is loaded
  if (!isLoaded) return null;

  return (
    <div className={`min-h-screen ${isMainDashboard ? 'bg-background' : ''}`}>
      <Suspense fallback={null}>
        <CreateWorkspaceModal />
        <CreateProjectModal />
        <CreateWorkItemModal />
        <CreateTaskModal />
        <EditTaskModal />
        <TaskDetailsModalWrapper />
        <TaskPreviewModalWrapper />
        <CreateCustomColumnModalWrapper />
        <ManageColumnsModalWrapper />
        <CreateProgramModal />
        <EditProgramModal />
        {workspaceId && (
          <>
            <CreateSpaceModal />
            <CreateWorkflowModal workspaceId={workspaceId} />
            <CreateLinkModal workspaceId={workspaceId} />
          </>
        )}
      </Suspense>

      <div className="flex w-full h-screen">
        <div className="fixed left-0 top-0 hidden lg:block lg:w-[264px] h-full overflow-y-auto">
          {isProfilePage ? <ProfileSidebar /> : <Sidebar />}
        </div>
        <div className="lg:pl-[264px] w-full flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="mx-auto max-w-screen-2xl">
              <main className={cn(
                "flex flex-col",
                isTaskDetailPage ? "py-0 px-0" : "py-8 px-6"
              )}>
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>

      {/* Project AI Chat - floating button, only shows on project pages */}
      <Suspense fallback={null}>
        <ProjectAIChatWrapper />
      </Suspense>
    </div>
  );
};

/**
 * Dashboard Layout with Centralized Lifecycle Management
 * 
 * Architecture:
 * 1. AccountLifecycleProvider - Single source of truth for lifecycle state
 * 2. LifecycleGuard - Enforces routing rules BEFORE rendering
 * 3. DashboardContent - Actual dashboard UI (only renders when valid)
 * 
 * This ensures:
 * - No invalid screen is ever rendered
 * - Routing decisions are made at the layout level
 * - Zero-flash experience during redirects
 */
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <LifecycleGuard>
      <DashboardContent>{children}</DashboardContent>
    </LifecycleGuard>
  );
};

export default DashboardLayout;