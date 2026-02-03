"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Users2, 
  Pencil, 
  TrendingUp, 
  Target, 
  Clock, 
  FolderKanban,
  BarChart3,
  Flag,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useGetProgram } from "@/features/programs/api/use-get-program";
import { useProgramIdParam } from "@/features/programs/hooks/use-program-id-param";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useEditProgramModal } from "@/features/programs/hooks/use-edit-program-modal";
import { useProgramId } from "@/features/programs/hooks/use-program-id";
import { EditProgramModal } from "@/features/programs/components/edit-program-modal";
import { ProgramProjectsList } from "@/features/programs/components/program-projects-list";
import { ProgramMembersTable } from "@/features/programs/components/program-members-table";
import { ProgramMilestones } from "@/features/programs/components/program-milestones";
import { ProgramAnalyticsDashboard } from "@/features/programs/components/program-analytics-dashboard";
import { ProgramStatus } from "@/features/programs/types";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { cn } from "@/lib/utils";

const getStatusColor = (status: ProgramStatus) => {
  switch (status) {
    case ProgramStatus.ACTIVE:
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    case ProgramStatus.PLANNING:
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case ProgramStatus.ON_HOLD:
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case ProgramStatus.COMPLETED:
      return "bg-muted text-muted-foreground border-border";
    case ProgramStatus.CANCELLED:
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getStatusIcon = (status: ProgramStatus) => {
  switch (status) {
    case ProgramStatus.ACTIVE:
      return TrendingUp;
    case ProgramStatus.PLANNING:
      return Target;
    case ProgramStatus.ON_HOLD:
      return Clock;
    case ProgramStatus.COMPLETED:
      return Target;
    case ProgramStatus.CANCELLED:
      return Target;
    default:
      return Target;
  }
};

const getStatusLabel = (status: ProgramStatus) => {
  return status.replace(/_/g, " ");
};

export const ProgramIdClient = () => {
  const programId = useProgramIdParam();
  const workspaceId = useWorkspaceId();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: program, isLoading: isLoadingProgram } = useGetProgram({
    programId,
  });
  const { open: openEdit } = useEditProgramModal();
  const [, setProgramId] = useProgramId();
  const { isAdmin } = useCurrentMember({ workspaceId });

  const handleEdit = () => {
    setProgramId(programId);
    openEdit();
  };

  if (isLoadingProgram) {
    return <PageLoader />;
  }

  if (!program) {
    return <PageError message="Program not found." />;
  }

  const StatusIcon = getStatusIcon(program.status);
  const canManage = isAdmin;

  return (
    <div className="flex flex-col gap-y-6 p-6">
      <EditProgramModal />
      
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Link href={`/workspaces/${workspaceId}/programs`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Programs
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-16 rounded-lg border">
            {program.imageUrl ? (
              <AvatarImage src={program.imageUrl} alt={program.name} />
            ) : (
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-xl">
                {program.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
              <Badge className={cn("text-xs font-normal", getStatusColor(program.status))}>
                <StatusIcon className="size-3 mr-1" />
                {getStatusLabel(program.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              {program.description || "No description provided"}
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleEdit}>
            <Pencil className="size-4" />
            Edit Program
          </Button>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="size-4" />
            <span className="hidden sm:inline">Projects</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users2 className="size-4" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2">
            <Flag className="size-4" />
            <span className="hidden sm:inline">Milestones</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="size-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Program Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FolderKanban className="size-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={cn("text-sm", getStatusColor(program.status))}>
                  <StatusIcon className="size-3.5 mr-1.5" />
                  {getStatusLabel(program.status)}
                </Badge>
              </CardContent>
            </Card>

            {/* Start Date Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-4" />
                  Start Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {program.startDate 
                    ? format(new Date(program.startDate), "MMM d, yyyy")
                    : "Not set"
                  }
                </p>
              </CardContent>
            </Card>

            {/* End Date Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-4" />
                  End Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {program.endDate 
                    ? format(new Date(program.endDate), "MMM d, yyyy")
                    : "Not set"
                  }
                </p>
              </CardContent>
            </Card>

            {/* Program Lead Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users2 className="size-4" />
                  Program Lead
                </CardTitle>
              </CardHeader>
              <CardContent>
                {program.programLead ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      {program.programLead.profileImageUrl ? (
                        <AvatarImage src={program.programLead.profileImageUrl} />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {program.programLead.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-medium text-sm">{program.programLead.name}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Program Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
              <CardDescription>Overview information about this program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Program Name</p>
                  <p className="font-medium">{program.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={cn("text-xs font-normal", getStatusColor(program.status))}>
                    <StatusIcon className="size-3 mr-1" />
                    {getStatusLabel(program.status)}
                  </Badge>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{program.description || "No description provided"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(program.$createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                {program.startDate && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {format(new Date(program.startDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
                {program.endDate && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {format(new Date(program.endDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-6">
          <ProgramProjectsList 
            programId={programId} 
            workspaceId={workspaceId}
            canManage={canManage}
          />
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          <ProgramMembersTable 
            programId={programId}
            workspaceId={workspaceId}
            canManageMembers={canManage}
          />
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="mt-6">
          <ProgramMilestones 
            programId={programId}
            canManage={canManage}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <ProgramAnalyticsDashboard programId={programId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
