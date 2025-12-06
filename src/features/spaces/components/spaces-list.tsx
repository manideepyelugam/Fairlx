"use client";

import { useRouter } from "next/navigation";
import { Folder, Plus, ChevronRight, Globe, Lock } from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetSpaces } from "../api/use-get-spaces";
import { useCreateSpaceModal } from "../hooks/use-create-space-modal";
import { SpaceAvatar } from "./space-avatar";
import { SpaceVisibility } from "../types";

export const SpacesList = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { open } = useCreateSpaceModal();
  const { data, isLoading } = useGetSpaces({ workspaceId });

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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Folder className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No spaces yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a space to organize your projects
            </p>
            <Button onClick={open}>
              <Plus className="size-4 mr-1" />
              Create Space
            </Button>
          </div>
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
