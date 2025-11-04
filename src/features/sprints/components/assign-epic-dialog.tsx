"use client";

import { useState } from "react";
import { Layers, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { useGetEpics } from "../api/use-get-epics";
import { useUpdateWorkItem } from "../api/use-update-work-item";
import { PopulatedWorkItem } from "../types";

interface AssignEpicDialogProps {
  workItem: PopulatedWorkItem;
  workspaceId: string;
  projectId: string;
  open: boolean;
  onClose: () => void;
}

export const AssignEpicDialog = ({
  workItem,
  workspaceId,
  projectId,
  open,
  onClose,
}: AssignEpicDialogProps) => {
  const [search, setSearch] = useState("");
  const { data: epicsData, isLoading } = useGetEpics({ workspaceId, projectId });
  const { mutate: updateWorkItem, isPending } = useUpdateWorkItem();

  const epics = epicsData?.documents || [];
  const filteredEpics = epics.filter(
    (epic) =>
      epic.key.toLowerCase().includes(search.toLowerCase()) ||
      epic.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssignEpic = (epicId: string | null) => {
    updateWorkItem(
      {
        param: { workItemId: workItem.$id },
        json: { epicId },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-5" />
            Assign Parent Epic
          </DialogTitle>
          <DialogDescription>
            Link {workItem.key} to an epic to organize related work items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Epic */}
          {workItem.epic && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-sm font-medium mb-1">Current Epic</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-300">
                    {workItem.epic.key}
                  </Badge>
                  <span className="text-sm">{workItem.epic.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAssignEpic(null)}
                  disabled={isPending}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search epics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Epic List */}
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Loading epics...
                </div>
              ) : filteredEpics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {search ? "No epics found" : "No epics available"}
                  </p>
                  {!search && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Create an epic first to link work items
                    </p>
                  )}
                </div>
              ) : (
                filteredEpics.map((epic) => (
                  <button
                    key={epic.$id}
                    onClick={() => handleAssignEpic(epic.$id)}
                    disabled={isPending || epic.$id === workItem.epic?.$id}
                    className="w-full p-3 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-300 shrink-0">
                        {epic.key}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {epic.title}
                        </div>
                        {epic.description && (
                          <div className="text-xs text-muted-foreground truncate mt-1">
                            {epic.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
