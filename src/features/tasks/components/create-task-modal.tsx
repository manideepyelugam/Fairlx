"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateTaskFormWrapper } from "./create-task-form-wrapper";

import { useCreateTaskModal } from "../hooks/use-create-task-modal";

export const CreateTaskModal = () => {
  const { isOpen, setIsOpen, close } = useCreateTaskModal();

  const handleOpenChange = (next: boolean) => {
    if (next === isOpen) return;
    setIsOpen(next);
  };
  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange}>
      <CreateTaskFormWrapper onCancel={close} />
    </ResponsiveModal>
  );
};
