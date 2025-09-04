"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataKanban } from "@/features/tasks/components/data-kanban";
import { useManageColumnsModal } from "../hooks/use-manage-columns-modal"; // shared via query param

import { Task, TaskStatus } from "@/features/tasks/types";

interface SafeEnhancedDataKanbanProps {
  data: Task[] | undefined;
  onChange: (
    tasks: { $id: string; status: TaskStatus | string; position: number }[]
  ) => void;
  isAdmin?: boolean;
  members?: Array<{ $id: string; name: string }>;
}

export const SafeEnhancedDataKanban = ({ 
  data = [], 
  onChange, 
  isAdmin = false,
  members = []
}: SafeEnhancedDataKanbanProps) => {
  

  const { open: openManageModal } = useManageColumnsModal();
  
  const handleOpenManageModal = useCallback(() => {
    // Manage Columns modal opened
    openManageModal();
  }, [openManageModal]);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenManageModal}
          >
            Manage Columns
          </Button>
        </div>
      </div>

      <DataKanban
        data={data || []}
        onChange={onChange}
        isAdmin={isAdmin}
        members={members}
      />
    </>
  );
};
