"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateTeamForm } from "./create-team-form";

import { useCreateTeamModal } from "../hooks/use-create-team-modal";

export const CreateTeamModal = () => {
  const { isOpen, setIsOpen, close } = useCreateTeamModal();

  const handleOpenChange = (next: boolean) => {
    if (next === isOpen) return;
    setIsOpen(next);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange}>
      <CreateTeamForm onCancel={close} />
    </ResponsiveModal>
  );
};
