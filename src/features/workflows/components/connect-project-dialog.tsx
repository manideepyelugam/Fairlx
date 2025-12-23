"use client";

import { useState } from "react";
import { Folder, Link as LinkIcon, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Project } from "@/features/projects/types";
import { Workflow } from "../types";

interface ConnectProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: Workflow;
  availableProjects: Project[];
  isLoading?: boolean;
  onConnect: (projectId: string) => void;
}

export const ConnectProjectDialog = ({
  open,
  onOpenChange,
  workflow,
  availableProjects,
  isLoading = false,
  onConnect,
}: ConnectProjectDialogProps) => {
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const filteredProjects = availableProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      (project.key && project.key.toLowerCase().includes(search.toLowerCase()))
  );

  const handleConnect = () => {
    if (selectedProjectId) {
      onConnect(selectedProjectId);
      setSelectedProjectId(null);
      setSearch("");
    }
  };

  const handleClose = () => {
    setSelectedProjectId(null);
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="size-5" />
            Connect Project to Workflow
          </DialogTitle>
          <DialogDescription>
            Select a project to use the <strong>{workflow.name}</strong> workflow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Project List */}
          <ScrollArea className="h-[280px] border rounded-lg">
            {filteredProjects.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredProjects.map((project) => (
                  <button
                    key={project.$id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.$id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedProjectId === project.$id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted border border-transparent"
                    }`}
                  >
                    <div
                      className="size-10 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: project.color || "#6366f1" }}
                    >
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{project.name}</span>
                        {project.key && (
                          <Badge variant="secondary" className="text-xs font-mono shrink-0">
                            {project.key}
                          </Badge>
                        )}
                      </div>
                      {project.workflowId ? (
                        <p className="text-xs text-amber-600">
                          Currently using a different workflow
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No workflow assigned
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Folder className="size-8 mb-2 opacity-50" />
                <p className="text-sm">
                  {search ? "No projects match your search" : "No available projects"}
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={!selectedProjectId || isLoading}
            >
              {isLoading ? "Connecting..." : "Connect Project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
