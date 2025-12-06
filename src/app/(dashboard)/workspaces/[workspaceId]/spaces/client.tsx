"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { SpacesList } from "@/features/spaces/components/spaces-list";
import { useCreateSpaceModal } from "@/features/spaces/hooks/use-create-space-modal";
import { CreateSpaceModal } from "@/features/spaces/components/create-space-modal";

export const SpacesClient = () => {
  const workspaceId = useWorkspaceId();
  const { isAdmin } = useCurrentMember({ workspaceId });
  const { open } = useCreateSpaceModal();

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
        {isAdmin && (
          <Button onClick={open}>
            <Plus className="size-4 mr-2" />
            Create Space
          </Button>
        )}
      </div>

      <SpacesList />
    </div>
  );
};
