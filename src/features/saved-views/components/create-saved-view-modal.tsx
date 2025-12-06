"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { CreateSavedViewForm } from "./create-saved-view-form";
import { useCreateSavedViewModal } from "../hooks/use-create-saved-view-modal";
import { SortConfig, FilterGroup } from "../types";

interface CreateSavedViewModalProps {
  workspaceId: string;
  projectId?: string;
  spaceId?: string;
  currentFilters?: FilterGroup;
  currentSort?: SortConfig[];
}

export const CreateSavedViewModal = ({
  workspaceId,
  projectId,
  spaceId,
  currentFilters,
  currentSort,
}: CreateSavedViewModalProps) => {
  const { isOpen, setIsOpen, close } = useCreateSavedViewModal();

  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <CreateSavedViewForm
        workspaceId={workspaceId}
        projectId={projectId}
        spaceId={spaceId}
        currentFilters={currentFilters}
        currentSort={currentSort}
        onCancel={close}
        onSuccess={close}
      />
    </ResponsiveModal>
  );
};
