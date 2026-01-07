"use client";

import { useState, useMemo } from "react";
import { Folder, Link as LinkIcon, Search, AlertTriangle, CheckCircle } from "lucide-react";

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
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Project } from "@/features/projects/types";
import { PopulatedWorkflow } from "../types";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetCustomColumns } from "@/features/custom-columns/api/use-get-custom-columns";
import { 
  WorkflowConflictDialog, 
  StatusConflictInfo,
  ResolutionStrategy,
  detectWorkflowProjectConflict,
  CustomColumnForConflict
} from "./workflow-conflict-dialog";

interface ConnectProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: PopulatedWorkflow;
  availableProjects: Project[];
  isLoading?: boolean;
  onConnect: (projectId: string, resolution?: ResolutionStrategy) => void;
}

export const ConnectProjectDialog = ({
  open,
  onOpenChange,
  workflow,
  availableProjects,
  isLoading = false,
  onConnect,
}: ConnectProjectDialogProps) => {
  const workspaceId = useWorkspaceId();
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<StatusConflictInfo | null>(null);

  // Fetch custom columns for the selected project
  const { data: customColumnsData } = useGetCustomColumns({
    workspaceId,
    projectId: selectedProjectId || "",
  });

  const customColumns: CustomColumnForConflict[] = useMemo(() => {
    if (!customColumnsData?.documents) return [];
    return customColumnsData.documents.map(col => ({
      $id: col.$id,
      name: col.name,
      color: col.color,
      icon: col.icon,
    }));
  }, [customColumnsData]);

  const filteredProjects = availableProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      (project.key && project.key.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedProject = useMemo(
    () => availableProjects.find(p => p.$id === selectedProjectId) || null,
    [availableProjects, selectedProjectId]
  );

  // Check for conflicts when a project is selected (include custom columns)
  const projectConflict = useMemo(() => {
    if (!selectedProject) return null;
    return detectWorkflowProjectConflict(workflow, selectedProject, customColumns);
  }, [workflow, selectedProject, customColumns]);

  const handleConnect = () => {
    if (!selectedProjectId || !selectedProject) return;

    // Check for conflicts
    if (projectConflict) {
      setCurrentConflict(projectConflict);
      setShowConflictDialog(true);
    } else {
      // No conflicts, connect directly
      onConnect(selectedProjectId);
      resetAndClose();
    }
  };

  const handleConflictResolution = (strategy: ResolutionStrategy) => {
    if (selectedProjectId) {
      onConnect(selectedProjectId, strategy);
      setShowConflictDialog(false);
      resetAndClose();
    }
  };

  const handleConflictCancel = () => {
    setShowConflictDialog(false);
    setCurrentConflict(null);
  };

  const resetAndClose = () => {
    setSelectedProjectId(null);
    setSearch("");
    setCurrentConflict(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    resetAndClose();
  };

  return (
    <>
      <Dialog open={open && !showConflictDialog} onOpenChange={handleClose}>
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
                  {filteredProjects.map((project) => {
                    const conflict = detectWorkflowProjectConflict(workflow, project);
                    const hasConflict = conflict !== null;
                    
                    return (
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
                            {hasConflict ? (
                              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                            ) : (
                              <CheckCircle className="size-3.5 text-green-500 shrink-0" />
                            )}
                          </div>
                          {project.workflowId ? (
                            <p className="text-xs text-amber-600">
                              Currently using a different workflow
                            </p>
                          ) : hasConflict ? (
                            <p className="text-xs text-amber-600">
                              Status configuration differs
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Ready to connect
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
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

            {/* Conflict Warning */}
            {projectConflict && selectedProject && (
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription className="text-xs">
                  <strong>{selectedProject.name}</strong> has different status configurations. 
                  You&apos;ll choose how to resolve this in the next step.
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConnect}
                disabled={!selectedProjectId || isLoading}
              >
                {isLoading ? "Connecting..." : projectConflict ? "Review & Connect" : "Connect Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conflict Resolution Dialog */}
      {showConflictDialog && selectedProject && currentConflict && (
        <WorkflowConflictDialog
          open={showConflictDialog}
          onOpenChange={setShowConflictDialog}
          workflow={workflow}
          project={selectedProject}
          conflict={currentConflict}
          isLoading={isLoading}
          onResolve={handleConflictResolution}
          onCancel={handleConflictCancel}
        />
      )}
    </>
  );
};
