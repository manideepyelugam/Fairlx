"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjectMembers } from "@/features/project-members/api/use-get-project-members";
import { useUpdateWorkItem } from "../api/use-update-work-item";
import { PopulatedWorkItem } from "../types";
import { useMemo } from "react";

interface AssignAssigneeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workItem: PopulatedWorkItem;
  workspaceId: string;
  projectId: string;
}

export const AssignAssigneeDialog = ({
  isOpen,
  onClose,
  workItem,
  workspaceId,
  projectId,
}: AssignAssigneeDialogProps) => {
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
    workItem.assigneeIds || []
  );

  const { data: membersData } = useGetMembers({ workspaceId });
  const { data: projectMembersData } = useGetProjectMembers({ projectId });
  const { mutate: updateWorkItem, isPending } = useUpdateWorkItem();

  const members = useMemo(() => {
    if (!membersData?.documents || !projectMembersData?.documents) return [];

    // Create a set of user IDs who are in this project
    const projectUserIds = new Set(projectMembersData.documents.map(m => m.userId));

    // Filter workspace members to only include those in the project
    return membersData.documents.filter(m => projectUserIds.has(m.userId));
  }, [membersData, projectMembersData]);

  const handleToggleAssignee = (memberId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSave = () => {
    updateWorkItem(
      {
        param: { workItemId: workItem.$id },
        json: { assigneeIds: selectedAssigneeIds },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Assignees</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No members found in this workspace
              </p>
            ) : (
              members.map((member) => {
                const isSelected = selectedAssigneeIds.includes(member.$id);
                return (
                  <div
                    key={member.$id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      isSelected && "bg-muted border-primary"
                    )}
                    onClick={() => handleToggleAssignee(member.$id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleAssignee(member.$id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Avatar className="size-8">
                      <AvatarImage src={member.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    {isSelected && (
                      <Check className="size-4 text-primary" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
