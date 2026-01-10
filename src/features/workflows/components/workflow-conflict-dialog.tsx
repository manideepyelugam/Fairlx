"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Folder,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { WorkflowStatus, PopulatedWorkflow } from "../types";
import { Project } from "@/features/projects/types";
import { TaskStatus } from "@/features/tasks/types";

// Default task statuses when project has no customWorkItemTypes
const DEFAULT_PROJECT_STATUSES = [
  { key: TaskStatus.TODO, label: "To Do", color: "#9CA3AF" },
  { key: TaskStatus.ASSIGNED, label: "Assigned", color: "#EF4444" },
  { key: TaskStatus.IN_PROGRESS, label: "In Progress", color: "#F59E0B" },
  { key: TaskStatus.IN_REVIEW, label: "In Review", color: "#3B82F6" },
  { key: TaskStatus.DONE, label: "Done", color: "#10B981" },
];

// Types for conflict detection
export interface ProjectStatusInfo {
  key: string;
  label: string;
  color: string;
  icon?: string;
  isCustom?: boolean; // true if it's a custom column
}

export interface StatusConflictInfo {
  // Statuses in workflow but not in project
  workflowOnlyStatuses: WorkflowStatus[];
  // Statuses in project but not in workflow
  projectOnlyStatuses: ProjectStatusInfo[];
  // Matching statuses
  matchingStatuses: WorkflowStatus[];
  // All project statuses for display
  allProjectStatuses: ProjectStatusInfo[];
  // Tasks that would be affected if using workflow priority
  affectedTaskCount?: number;
}

export type ResolutionStrategy = "workflow" | "project";

interface WorkflowConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: PopulatedWorkflow;
  project: Project;
  conflict: StatusConflictInfo;
  isLoading?: boolean;
  onResolve: (strategy: ResolutionStrategy) => void;
  onCancel: () => void;
}

export const WorkflowConflictDialog = ({
  open,
  onOpenChange,
  workflow,
  project,
  conflict,
  isLoading = false,
  onResolve,
  onCancel,
}: WorkflowConflictDialogProps) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy>("workflow");

  const hasWorkflowOnlyStatuses = conflict.workflowOnlyStatuses.length > 0;
  const hasProjectOnlyStatuses = conflict.projectOnlyStatuses.length > 0;
  const hasConflicts = hasWorkflowOnlyStatuses || hasProjectOnlyStatuses;

  const handleResolve = () => {
    onResolve(selectedStrategy);
  };

  const handleClose = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="size-5" />
            Status Conflict Detected
          </DialogTitle>
          <DialogDescription>
            The workflow statuses don&apos;t match the project&apos;s current configuration.
            Choose how to resolve this conflict.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Conflict Summary */}
            <div className="grid grid-cols-2 gap-4">
              {/* Workflow Side */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="size-4 text-primary" />
                  <span className="font-medium text-sm">{workflow.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {workflow.statuses?.length || 0} statuses
                  </Badge>
                </div>
                <div className="space-y-1">
                  {workflow.statuses?.map((status) => {
                    const isWorkflowOnly = conflict.workflowOnlyStatuses.some(
                      (s) => s.key === status.key
                    );
                    return (
                      <div
                        key={status.$id}
                        className={`flex items-center gap-2 p-1.5 rounded text-xs ${
                          isWorkflowOnly ? "bg-green-50 dark:bg-green-900/20" : ""
                        }`}
                      >
                        <div
                          className="size-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className={isWorkflowOnly ? "text-green-700 dark:text-green-400" : ""}>
                          {status.name}
                        </span>
                        {isWorkflowOnly && (
                          <Badge variant="outline" className="text-[9px] h-4 text-green-600 border-green-300">
                            New
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Side */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Folder className="size-4 text-primary" />
                  <span className="font-medium text-sm">{project.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {conflict.allProjectStatuses?.length || (conflict.matchingStatuses.length + conflict.projectOnlyStatuses.length)} statuses
                  </Badge>
                </div>
                <div className="space-y-1">
                  {/* Show all project statuses */}
                  {(conflict.allProjectStatuses || [...conflict.matchingStatuses.map(s => ({ key: s.key, label: s.name, color: s.color })), ...conflict.projectOnlyStatuses]).map((status) => {
                    // Check if this status is project-only (not in workflow)
                    const isProjectOnly = conflict.projectOnlyStatuses.some(
                      (s) => s.key === status.key || s.label.toLowerCase() === status.label.toLowerCase()
                    );
                    return (
                      <div
                        key={status.key}
                        className={`flex items-center gap-2 p-1.5 rounded text-xs ${
                          isProjectOnly ? "bg-amber-50 dark:bg-amber-900/20" : ""
                        }`}
                      >
                        <div
                          className="size-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className={isProjectOnly ? "text-amber-700 dark:text-amber-400" : ""}>
                          {status.label}
                        </span>
                        {isProjectOnly && (
                          <Badge variant="outline" className="text-[9px] h-4 text-amber-600 border-amber-300">
                            {'isCustom' in status && (status as ProjectStatusInfo).isCustom ? "Custom" : "Project Only"}
                          </Badge>
                        )}
                        {!isProjectOnly && (
                          <CheckCircle className="size-3 text-green-500 ml-auto" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <Separator />

            {/* Resolution Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Choose Resolution Strategy</h4>
              
              <RadioGroup
                value={selectedStrategy}
                onValueChange={(v) => setSelectedStrategy(v as ResolutionStrategy)}
                className="space-y-3"
              >
                {/* Option 1: Use Workflow */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedStrategy === "workflow" 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-muted-foreground/40"
                  }`}
                  onClick={() => setSelectedStrategy("workflow")}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="workflow" id="workflow" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="workflow" className="font-medium cursor-pointer flex items-center gap-2">
                        <GitBranch className="size-4 text-primary" />
                        Use Workflow Statuses
                        <Badge variant="default" className="text-[10px]">Recommended</Badge>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        The workflow&apos;s statuses will be used. Project columns will be updated to match.
                      </p>
                      
                      {hasProjectOnlyStatuses && (
                        <Alert variant="destructive" className="mt-3 py-2">
                          <AlertCircle className="size-3.5" />
                          <AlertTitle className="text-xs font-medium">Warning</AlertTitle>
                          <AlertDescription className="text-xs">
                            {conflict.projectOnlyStatuses.length} status(es) will be removed from the project:
                            {" "}
                            <span className="font-medium">
                              {conflict.projectOnlyStatuses.map(s => s.label).join(", ")}
                            </span>
                            . Tasks in these columns will need to be reassigned or will be removed.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>

                {/* Option 2: Use Project */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedStrategy === "project" 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-muted-foreground/40"
                  }`}
                  onClick={() => setSelectedStrategy("project")}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="project" id="project" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="project" className="font-medium cursor-pointer flex items-center gap-2">
                        <Folder className="size-4 text-amber-500" />
                        Use Project Statuses
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        The project&apos;s current statuses will be added to the workflow.
                        No data will be lost.
                      </p>
                      
                      {hasWorkflowOnlyStatuses && (
                        <Alert className="mt-3 py-2">
                          <AlertTriangle className="size-3.5" />
                          <AlertTitle className="text-xs font-medium">Note</AlertTitle>
                          <AlertDescription className="text-xs">
                            {conflict.workflowOnlyStatuses.length} workflow status(es) will remain hidden:
                            {" "}
                            <span className="font-medium">
                              {conflict.workflowOnlyStatuses.map(s => s.name).join(", ")}
                            </span>
                            . They won&apos;t appear on the project board until added.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Visual Flow */}
            {hasConflicts && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">What will happen</h4>
                  <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      {selectedStrategy === "workflow" ? (
                        <GitBranch className="size-5 text-primary" />
                      ) : (
                        <Folder className="size-5 text-amber-500" />
                      )}
                      <span className="text-sm font-medium">
                        {selectedStrategy === "workflow" ? workflow.name : project.name}
                      </span>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      {selectedStrategy === "workflow" ? (
                        <Folder className="size-5 text-muted-foreground" />
                      ) : (
                        <GitBranch className="size-5 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {selectedStrategy === "workflow" ? project.name : workflow.name}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={isLoading}>
            {isLoading ? "Resolving..." : "Confirm & Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Custom column type for conflict detection
export interface CustomColumnForConflict {
  $id: string;
  name: string;
  color: string;
  icon?: string;
}

// Utility function to detect conflicts between workflow and project
export function detectWorkflowProjectConflict(
  workflow: PopulatedWorkflow,
  project: Project,
  customColumns?: CustomColumnForConflict[]
): StatusConflictInfo | null {
  const workflowStatuses = workflow.statuses || [];
  
  // Helper function to normalize keys for comparison
  const normalizeKey = (key: string): string => {
    return key.toLowerCase().replace(/[\s_-]+/g, "_");
  };
  
  // Helper function to normalize names for comparison
  const normalizeName = (name: string): string => {
    return name.toLowerCase().trim();
  };
  
  // Build workflow lookup maps
  const workflowStatusKeyMap = new Map<string, WorkflowStatus>();
  const workflowStatusNameMap = new Map<string, WorkflowStatus>();
  for (const status of workflowStatuses) {
    workflowStatusKeyMap.set(normalizeKey(status.key), status);
    workflowStatusNameMap.set(normalizeName(status.name), status);
  }
  
  // Build project statuses from:
  // 1. customWorkItemTypes if available
  // 2. Default statuses
  // 3. Custom columns (additional columns created for the project)
  let projectStatuses: ProjectStatusInfo[] = [];
  
  if (project.customWorkItemTypes && project.customWorkItemTypes.length > 0) {
    // Use customWorkItemTypes if available
    projectStatuses = project.customWorkItemTypes.map(t => ({
      key: t.key,
      label: t.label,
      color: t.color,
      icon: t.icon,
      isCustom: false,
    }));
  } else {
    // Use default statuses
    projectStatuses = DEFAULT_PROJECT_STATUSES.map(t => ({
      ...t,
      isCustom: false,
    }));
  }
  
  // Add custom columns (these are additional columns created in the project)
  if (customColumns && customColumns.length > 0) {
    const existingNames = new Set(projectStatuses.map(s => normalizeName(s.label)));
    for (const col of customColumns) {
      // Check if custom column already exists by name
      if (!existingNames.has(normalizeName(col.name))) {
        projectStatuses.push({
          key: col.$id,
          label: col.name,
          color: col.color,
          icon: col.icon,
          isCustom: true,
        });
        existingNames.add(normalizeName(col.name));
      }
    }
  }

  // Helper to check if a project status matches any workflow status
  const findMatchingWorkflowStatus = (projectStatus: ProjectStatusInfo): WorkflowStatus | undefined => {
    // Try key match first
    const byKey = workflowStatusKeyMap.get(normalizeKey(projectStatus.key));
    if (byKey) return byKey;
    
    // Try name match
    const byName = workflowStatusNameMap.get(normalizeName(projectStatus.label));
    return byName;
  };

  // Find workflow-only statuses (in workflow but not project)
  const projectNormalizedKeys = new Set(projectStatuses.map(s => normalizeKey(s.key)));
  const projectNormalizedNames = new Set(projectStatuses.map(s => normalizeName(s.label)));
  
  const workflowOnlyStatuses = workflowStatuses.filter(s => {
    const keyMatch = projectNormalizedKeys.has(normalizeKey(s.key));
    const nameMatch = projectNormalizedNames.has(normalizeName(s.name));
    return !keyMatch && !nameMatch;
  });

  // Find project-only statuses (in project but not workflow)
  const projectOnlyStatuses = projectStatuses.filter(
    t => !findMatchingWorkflowStatus(t)
  );

  // Find matching statuses
  const matchingStatuses = workflowStatuses.filter(s => {
    const keyMatch = projectNormalizedKeys.has(normalizeKey(s.key));
    const nameMatch = projectNormalizedNames.has(normalizeName(s.name));
    return keyMatch || nameMatch;
  });

  // If no conflicts, return null
  if (workflowOnlyStatuses.length === 0 && projectOnlyStatuses.length === 0) {
    return null;
  }

  return {
    workflowOnlyStatuses,
    projectOnlyStatuses,
    matchingStatuses,
    allProjectStatuses: projectStatuses,
    affectedTaskCount: 0, // Would need to query tasks to get this count
  };
}
