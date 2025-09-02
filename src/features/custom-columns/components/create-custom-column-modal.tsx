"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { CreateCustomColumnForm } from "./create-custom-column-form";
import { useCreateCustomColumnModal } from "../hooks/use-create-custom-column-modal";

export const CreateCustomColumnModal = () => {
  const { isOpen, setIsOpen, close } = useCreateCustomColumnModal();

  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <CreateCustomColumnForm onCancel={close} />
    </ResponsiveModal>
  );
};
