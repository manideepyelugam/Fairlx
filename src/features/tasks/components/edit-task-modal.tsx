"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { EditTaskFormWrapper } from "./edit-task-form-wrapper";

import { useEditTaskModal } from "../hooks/use-edit-task-modal";

export const EditTaskModal = () => {
  const { taskId, close } = useEditTaskModal();

  return (
    <Dialog open={!!taskId} onOpenChange={close}>
      <DialogContent className="max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 border-none">
        <VisuallyHidden>
          <DialogTitle>Edit Work Item</DialogTitle>
        </VisuallyHidden>
        {taskId && <EditTaskFormWrapper id={taskId} onCancel={close} />}
      </DialogContent>
    </Dialog>
  );
};
