"use client";

import { useParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";

import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { TimesheetView } from "@/features/time-tracking/components/timesheet-view";
import { EstimatesVsActuals } from "@/features/time-tracking/components/estimates-vs-actuals";

export const TimeTrackingClient = () => {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const {
    data: projects,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useGetProjects({ workspaceId });

  if (isLoadingProjects) {
    return <PageLoader />;
  }

  if (projectsError) {
    return <PageError message="Failed to load projects" />;
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Time Tracking</h1>
      </div>

      <Tabs defaultValue="timesheet" className="w-full">
        <TabsList>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
          <TabsTrigger value="estimates">Estimates vs Actuals</TabsTrigger>
        </TabsList>

        <TabsContent value="timesheet" className="space-y-4">
          <TimesheetView workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="estimates" className="space-y-4">
          <EstimatesVsActuals 
            workspaceId={workspaceId} 
            projects={projects?.documents}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
