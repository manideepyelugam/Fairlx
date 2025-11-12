"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateProgramForm } from "./create-program-form";

import { useCreateProgramModal } from "../hooks/use-create-program-modal";

export const CreateProgramModal = () => {
  const { isOpen, setIsOpen, close } = useCreateProgramModal();

  const handleOpenChange = (next: boolean) => {
    if (next === isOpen) return;
    setIsOpen(next);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange}>
      <CreateProgramForm onCancel={close} />
    </ResponsiveModal>
  );
};
