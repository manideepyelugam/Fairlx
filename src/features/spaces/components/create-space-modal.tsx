"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateSpaceForm } from "./create-space-form";
import { useCreateSpaceModal } from "../hooks/use-create-space-modal";

export const CreateSpaceModal = () => {
  const { isOpen, setIsOpen, close } = useCreateSpaceModal();

  const handleOpenChange = (next: boolean) => {
    if (next === isOpen) return;
    setIsOpen(next);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange}>
      <CreateSpaceForm onCancel={close} />
    </ResponsiveModal>
  );
};
