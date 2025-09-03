"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateWorkspaceForm } from "./create-workspace-form";

import { useCreateWorkspaceModal } from "../hooks/use-create-workspace-modal";

export const CreateWorkspaceModal = () => {
  const { isOpen, setIsOpen, close } = useCreateWorkspaceModal();

  const handleOpenChange = (next: boolean) => {
    if (next === isOpen) return;
    setIsOpen(next);
  };
  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange}>
      <CreateWorkspaceForm onCancel={close} />
    </ResponsiveModal>
  );
};
