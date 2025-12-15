"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useGetProjects } from "../api/use-get-projects";
import { useCopyProjectSettings } from "../api/use-copy-project-settings";

interface CopySettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentProjectId: string;
    workspaceId: string;
}

export const CopySettingsDialog = ({ open, onOpenChange, currentProjectId, workspaceId }: CopySettingsDialogProps) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const { data: projects, isLoading } = useGetProjects({ workspaceId });
    const { mutate: copySettings, isPending } = useCopyProjectSettings();

    const handleCopy = () => {
        if (!selectedProjectId) return;

        copySettings({
            param: { projectId: currentProjectId },
            json: { sourceProjectId: selectedProjectId }
        }, {
            onSuccess: () => {
                onOpenChange(false);
                setSelectedProjectId("");
                // Reload page to reflect changes in the form if needed, or query invalidation handles is
                window.location.reload();
            }
        });
    };

    // Filter out current project
    const availableProjects = projects?.documents.filter(p => p.$id !== currentProjectId) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Copy Project Settings</DialogTitle>
                    <DialogDescription>
                        Copy Work Item Types, Priorities, and Labels from another project.
                        This will overwrite any custom settings in the current project.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Select
                        value={selectedProjectId}
                        onValueChange={setSelectedProjectId}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a project..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableProjects.map((project) => (
                                <SelectItem key={project.$id} value={project.$id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleCopy} disabled={!selectedProjectId || isPending}>
                        {isPending ? "Copying..." : "Copy Settings"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
