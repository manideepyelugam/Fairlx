"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { ManageColumnsForm } from "./manage-columns-form";
import { useManageColumnsModal } from "../hooks/use-manage-columns-modal";

export const ManageColumnsModal = () => {
  const { isOpen, setIsOpen, close } = useManageColumnsModal();

  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen} showCloseButton={false}>
      <ManageColumnsForm onCancel={close} />
    </ResponsiveModal>
  );
};
