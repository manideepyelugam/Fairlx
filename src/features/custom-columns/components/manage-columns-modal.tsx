"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { ManageColumnsForm } from "./manage-columns-form";
import { useManageColumnsModal } from "../hooks/use-manage-columns-modal";

export const ManageColumnsModal = () => {
  const { isOpen, setIsOpen, close } = useManageColumnsModal();

  // Prevent closing by clicking outside — force users to use Cancel/Save buttons
  // so unsaved changes alert can be shown
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(true);
    }
    // Don't allow closing via outside click - ManageColumnsForm.handleClose handles this
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange} showCloseButton={false}>
      <ManageColumnsForm onCancel={close} />
    </ResponsiveModal>
  );
};
