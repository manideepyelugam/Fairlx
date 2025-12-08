"use client";

import { Plus, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HierarchyDiagram } from "@/components/hierarchy-diagram";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { SpacesList } from "@/features/spaces/components/spaces-list";
import { useCreateSpaceModal } from "@/features/spaces/hooks/use-create-space-modal";
import { CreateSpaceModal } from "@/features/spaces/components/create-space-modal";
import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { SpacesGuide } from "@/features/spaces/components/spaces-guide";

export const SpacesClient = () => {
  const workspaceId = useWorkspaceId();
  const { isAdmin } = useCurrentMember({ workspaceId });
  const { open } = useCreateSpaceModal();
  const { data } = useGetSpaces({ workspaceId });
  const searchParams = useSearchParams();
  const [showGuide, setShowGuide] = useState(false);

  // Check if guide should be shown based on URL or if no spaces exist
  useEffect(() => {
    const guideParam = searchParams.get("guide");
    const hasSpaces = data?.documents && data.documents.length > 0;
    setShowGuide(guideParam === "true" || !hasSpaces);
  }, [searchParams, data]);

  return (
    <div className="flex flex-col gap-y-4">
      <CreateSpaceModal />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Spaces</h1>
          <p className="text-sm text-muted-foreground">
            Organize your work into logical spaces for better team collaboration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
          >
            <Info className="size-4 mr-2" />
            {showGuide ? "Hide" : "Show"} Guide
          </Button>
          {isAdmin && (
            <Button onClick={open}>
              <Plus className="size-4 mr-2" />
              Create Space
            </Button>
          )}
        </div>
      </div>

      {showGuide && (
        <div className="space-y-4">
          <HierarchyDiagram showPrograms={true} />
          <SpacesGuide />
        </div>
      )}

      {(!data?.documents || data.documents.length === 0) && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>New to Spaces?</strong> Spaces help you organize projects by department, team, or product. 
            Each space gets a unique key (like &quot;ENG&quot; for Engineering) that prefixes all work items, 
            making it easy to track and reference work across your organization.
          </AlertDescription>
        </Alert>
      )}

      <SpacesList />
    </div>
  );
};
