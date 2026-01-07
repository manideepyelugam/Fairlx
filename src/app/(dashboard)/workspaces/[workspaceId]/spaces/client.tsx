"use client";

import { Plus, Info, LayoutGrid, Sparkles, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  const spacesCount = data?.documents?.length || 0;

  return (
    <div className="flex flex-col gap-y-6">
      <CreateSpaceModal />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-3">
           
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Spaces</h1>
              <p className="text-sm mt-1 text-muted-foreground">
                Organize your work into logical spaces for better team collaboration
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="xs"
            onClick={() => setShowGuide(!showGuide)}
          >
            <Info className="size-4 mr-1.5" />
            {showGuide ? "Hide" : "Show"} Guide
          </Button>
          {isAdmin && (
            <Button onClick={open} size="xs" className="gap-1">
              <Plus className="size-3" />
              Create Space
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <LayoutGrid className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Spaces</p>
                <p className="text-xl font-bold">{spacesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Sparkles className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{spacesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guide Section */}
      {showGuide && (
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <Info className="size-4 text-primary" />
                <span className="text-sm font-medium">Getting Started with Spaces</span>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <HierarchyDiagram showPrograms={true} />
              <SpacesGuide />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!data?.documents || data.documents.length === 0) && !showGuide && (
        <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="p-3 rounded-full bg-primary/10 mb-4">
              <Layers className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No spaces yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Spaces help you organize projects by department, team, or product. 
              Each space gets a unique key (like &quot;ENG&quot; for Engineering) that prefixes all work items.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowGuide(true)}>
                <Info className="size-4 mr-1.5" />
                Learn More
              </Button>
              {isAdmin && (
                <Button size="sm" onClick={open}>
                  <Plus className="size-4 mr-1.5" />
                  Create Your First Space
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spaces List */}
      {spacesCount > 0 && <SpacesList />}
    </div>
  );
};
