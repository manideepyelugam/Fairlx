"use client";

import { ArrowLeft, Settings, Users, FolderKanban, BarChart3, Milestone as MilestoneIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

import { useGetProgram } from "@/features/programs/api/use-get-program";
import { useProgramId } from "@/features/programs/hooks/use-program-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";

import { ProgramDetailsHeader } from "@/features/programs/components/program-details-header";
import { ProgramProjectsList } from "@/features/programs/components/program-projects-list";
import { ProgramMilestones } from "@/features/programs/components/program-milestones";
import { ProgramMembersTable } from "@/features/programs/components/program-members-table";
import { ProgramAnalyticsDashboard } from "@/features/programs/components/program-analytics-dashboard";
import { EditProgramModal } from "@/features/programs/components/edit-program-modal";

export const ProgramIdClient = () => {
  const programId = useProgramId();
  const workspaceId = useWorkspaceId();
  const { data: program, isLoading: isLoadingProgram } = useGetProgram({ programId });
  const { isAdmin, isLoading: isLoadingMember } = useCurrentMember({ workspaceId });
  
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoadingProgram || isLoadingMember) {
    return <PageLoader />;
  }

  if (!program) {
    return <PageError message="Program not found." />;
  }

  return (
    <div className="flex flex-col gap-y-4">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/workspaces/${workspaceId}/programs`}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Programs
          </Link>
        </Button>
      </div>

      {/* Program Header */}
      <ProgramDetailsHeader programId={programId} workspaceId={workspaceId} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="size-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="size-4" />
            <span className="hidden sm:inline">Projects</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <MilestoneIcon className="size-4" />
            <span className="hidden sm:inline">Milestones</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="size-4" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="size-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ProgramAnalyticsDashboard programId={programId} />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <ProgramProjectsList 
            programId={programId}
            workspaceId={workspaceId}
            canManage={isAdmin} 
          />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <ProgramMilestones 
            programId={programId} 
            canManage={isAdmin} 
          />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <ProgramMembersTable 
            programId={programId}
            workspaceId={workspaceId}
            canManageMembers={isAdmin} 
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Program Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure your program settings, manage access, and customize program behavior.
              </p>
              
              {isAdmin ? (
                <div className="space-y-4">
                  <Button variant="outline" asChild>
                    <Link href={`/workspaces/${workspaceId}/programs/${programId}/settings`}>
                      <Settings className="size-4 mr-2" />
                      Advanced Settings
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You need admin access to modify program settings.
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Program Modal */}
      <EditProgramModal />
    </div>
  );
};
