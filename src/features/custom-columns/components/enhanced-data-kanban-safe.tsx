"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataKanban } from "@/features/tasks/components/data-kanban";
import { useCreateCustomColumnModal } from "../hooks/use-create-custom-column-modal"; // shared via query param

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
  console.log('SafeEnhancedDataKanban render:', { 
    dataLength: Array.isArray(data) ? data.length : 'not-array', 
    isAdmin, 
    membersLength: Array.isArray(members) ? members.length : 'not-array' 
  });

  const { open: openCreateModal } = useCreateCustomColumnModal();
  
  const handleOpenCreateModal = useCallback(() => {
    console.log('Add Custom Column clicked, opening modal...');
    openCreateModal();
  }, [openCreateModal]);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCreateModal}
          >
            Add Custom Column
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
