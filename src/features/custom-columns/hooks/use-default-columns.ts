"use client";

import { useState, useEffect, useMemo } from "react";
import { TaskStatus } from "@/features/tasks/types";

export interface DefaultColumn {
  id: TaskStatus;
  name: string;
  isEnabled: boolean;
}

const DEFAULT_COLUMNS_CONFIG: Omit<DefaultColumn, 'isEnabled'>[] = [
  { id: TaskStatus.BACKLOG, name: "Backlog" },
  { id: TaskStatus.TODO, name: "Todo" },
  { id: TaskStatus.IN_PROGRESS, name: "In Progress" },
  { id: TaskStatus.IN_REVIEW, name: "In Review" },
  { id: TaskStatus.DONE, name: "Done" },
];

export const useDefaultColumns = (workspaceId: string) => {
  const [defaultColumns, setDefaultColumns] = useState<DefaultColumn[]>([]);

  useEffect(() => {
    // Load saved configuration from localStorage
    const savedConfig = localStorage.getItem(`defaultColumns-${workspaceId}`);
    
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setDefaultColumns(parsed);
      } catch (error) {
        console.error("Failed to parse saved default columns config:", error);
        // Fall back to default configuration
        setDefaultColumns(DEFAULT_COLUMNS_CONFIG.map(col => ({ ...col, isEnabled: true })));
      }
    } else {
      // Initialize with all columns enabled
      setDefaultColumns(DEFAULT_COLUMNS_CONFIG.map(col => ({ ...col, isEnabled: true })));
    }
  }, [workspaceId]);

  const toggleColumn = (columnId: TaskStatus) => {
    const updated = defaultColumns.map(col => 
      col.id === columnId ? { ...col, isEnabled: !col.isEnabled } : col
    );
    setDefaultColumns(updated);
    
    // Save to localStorage
    localStorage.setItem(`defaultColumns-${workspaceId}`, JSON.stringify(updated));
  };

  const enableColumn = (columnId: TaskStatus) => {
    const updated = defaultColumns.map(col => 
      col.id === columnId ? { ...col, isEnabled: true } : col
    );
    setDefaultColumns(updated);
    
    // Save to localStorage
    localStorage.setItem(`defaultColumns-${workspaceId}`, JSON.stringify(updated));
  };

  const disableColumn = (columnId: TaskStatus) => {
    const updated = defaultColumns.map(col => 
      col.id === columnId ? { ...col, isEnabled: false } : col
    );
    setDefaultColumns(updated);
    
    // Save to localStorage
    localStorage.setItem(`defaultColumns-${workspaceId}`, JSON.stringify(updated));
    
    // Return true to indicate tasks may need to be moved
    return true;
  };

  const getEnabledColumns = useMemo(() => defaultColumns.filter(col => col.isEnabled), [defaultColumns]);
  const getDisabledColumns = useMemo(() => defaultColumns.filter(col => !col.isEnabled), [defaultColumns]);

  return {
    defaultColumns,
    toggleColumn,
    enableColumn,
    disableColumn,
    getEnabledColumns,
    getDisabledColumns,
  };
};
