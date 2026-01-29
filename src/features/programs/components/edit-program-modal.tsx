"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { useEditProgramModal } from "../hooks/use-edit-program-modal";
import { EditProgramForm } from "./edit-program-form";
import { useGetProgram } from "../api/use-get-program";
import { useProgramId } from "../hooks/use-program-id";

export const EditProgramModal = () => {
  const programId = useProgramId();
  const { isOpen, setIsOpen, close } = useEditProgramModal();
  const { data } = useGetProgram({ programId: programId || "" });

  if (!data) return null;

  return (
    <ResponsiveModal open={isOpen && !!programId} onOpenChange={setIsOpen}>
      <EditProgramForm onCancel={close} initialValues={data} />
    </ResponsiveModal>
  );
};
