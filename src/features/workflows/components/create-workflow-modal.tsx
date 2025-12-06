"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateWorkflowForm } from "./create-workflow-form";
import { useCreateWorkflowModal } from "../hooks/use-create-workflow-modal";

interface CreateWorkflowModalProps {
  workspaceId?: string;
  spaceId?: string;
  projectId?: string;
}

export const CreateWorkflowModal = ({ 
  workspaceId,
  spaceId,
  projectId,
}: CreateWorkflowModalProps) => {
  const { isOpen, setIsOpen, close } = useCreateWorkflowModal();

  const handleOpenChange = (next: boolean) => {
    if (next === isOpen) return;
    setIsOpen(next);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange}>
      <CreateWorkflowForm 
        workspaceId={workspaceId}
        spaceId={spaceId}
        projectId={projectId}
        onCancel={close} 
      />
    </ResponsiveModal>
  );
};
