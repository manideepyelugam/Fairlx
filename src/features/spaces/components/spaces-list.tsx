"use client";

import { useRouter } from "next/navigation";
import { Folder, Plus, ChevronRight, Globe, Lock } from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyStateWithGuide } from "@/components/empty-state-with-guide";

import { useGetSpaces } from "../api/use-get-spaces";
import { useCreateSpaceModal } from "../hooks/use-create-space-modal";
import { SpaceAvatar } from "./space-avatar";
import { SpaceVisibility } from "../types";

export const SpacesList = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { open } = useCreateSpaceModal();
  const { data, isLoading } = useGetSpaces({ workspaceId });
  const { isAdmin } = useCurrentMember({ workspaceId });

  const spaces = data?.documents ?? [];

  const handleSpaceClick = (spaceId: string) => {
    router.push(`/workspaces/${workspaceId}/spaces/${spaceId}`);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Spaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Folder className="size-5" />
          Spaces
        </CardTitle>
        <Button variant="teritary" size="sm" onClick={open}>
          <Plus className="size-4 mr-1" />
          New Space
        </Button>
      </CardHeader>
      <CardContent>
        {spaces.length === 0 ? (
          <EmptyStateWithGuide
            icon={Folder}
            title="No Spaces Yet"
            description="Spaces help you organize related projects by department, team, or product. Each space gets a unique key (like 'ENG' or 'MKT') that prefixes all work items."
            action={isAdmin ? {
              label: "Create Your First Space",
              onClick: open,
            } : undefined}
            guide={{
              title: "Why use Spaces?",
              steps: [
                "Group related projects together (e.g., all Engineering projects)",
                "Each space has a unique key for work item prefixes (ENG-123)",
                "Control access with Public or Private visibility",
                "Apply space-level workflows and settings",
                "Better organization for growing teams"
              ]
            }}
          />
        ) : (
          <div className="space-y-2">
            {spaces.map((space) => (
              <div
                key={space.$id}
                onClick={() => handleSpaceClick(space.$id)}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <SpaceAvatar
                    name={space.name}
                    image={space.imageUrl ?? undefined}
                    color={space.color ?? undefined}
                    className="size-10"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{space.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {space.key}
                      </span>
                      {space.visibility === SpaceVisibility.PRIVATE ? (
                        <Lock className="size-3 text-muted-foreground" />
                      ) : (
                        <Globe className="size-3 text-muted-foreground" />
                      )}
                    </div>
                    {space.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {space.description}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
