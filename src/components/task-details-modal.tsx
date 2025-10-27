"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TaskDetailsModalProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskDetailsModal = ({
  children,
  open,
  onOpenChange,
}: TaskDetailsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none">
        <div className="overflow-y-auto max-h-[90vh]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};
