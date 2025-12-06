"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateCustomFieldForm } from "./create-custom-field-form";
import { useCreateCustomFieldModal } from "../hooks/use-create-custom-field-modal";

export const CreateCustomFieldModal = () => {
  const { isOpen, setIsOpen, close } = useCreateCustomFieldModal();

  const handleOpenChange = (next: boolean) => {
    if (next === isOpen) return;
    setIsOpen(next);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange}>
      <CreateCustomFieldForm onCancel={close} />
    </ResponsiveModal>
  );
};
