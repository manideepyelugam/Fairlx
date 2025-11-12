"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { useEditTeamModal } from "../hooks/use-edit-team-modal";
import { EditTeamForm } from "./edit-team-form";
import { useGetTeam } from "../api/use-get-team";
import { useTeamId } from "../hooks/use-team-id";

export const EditTeamModal = () => {
  const [teamId] = useTeamId();
  const { isOpen, setIsOpen, close } = useEditTeamModal();
  const { data } = useGetTeam({ teamId: teamId || "" });

  if (!data) return null;

  return (
    <ResponsiveModal open={isOpen && !!teamId} onOpenChange={setIsOpen}>
      <EditTeamForm onCancel={close} initialValues={data} />
    </ResponsiveModal>
  );
};
