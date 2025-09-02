"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateProjectForm } from "./create-project-form";

import { useCreateProjectModal } from "../hooks/use-create-project-modal";

export const CreateProjectModal = () => {
  const { isOpen, setIsOpen, close } = useCreateProjectModal();

  const handleOpenChange = (next: boolean) => {
    if (next === isOpen) return;
    setIsOpen(next);
  };
  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange}>
      <CreateProjectForm onCancel={close} />
    </ResponsiveModal>
  );
};
