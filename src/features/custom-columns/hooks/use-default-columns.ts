"use client";

import { useState, useEffect, useMemo } from "react";
import { TaskStatus } from "@/features/tasks/types";
import { useGetDefaultColumnSettings } from "@/features/default-column-settings/api/use-get-default-column-settings";
import { useUpdateDefaultColumnSettings } from "@/features/default-column-settings/api/use-update-default-column-settings";

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

export const useDefaultColumns = (workspaceId: string, projectId?: string) => {
  // Only fetch settings if we have both workspaceId and projectId
  const { data: settingsData, isLoading } = useGetDefaultColumnSettings({ 
    workspaceId, 
    projectId: projectId || "" 
  });
  const { mutate: updateSettings } = useUpdateDefaultColumnSettings();

  const [defaultColumns, setDefaultColumns] = useState<DefaultColumn[]>(() => {
    // Initialize with all columns enabled by default
    return DEFAULT_COLUMNS_CONFIG.map(col => ({ ...col, isEnabled: true }));
  });

  // Update local state when database data loads
  useEffect(() => {
    if (settingsData?.documents && projectId) {
      const updatedColumns = DEFAULT_COLUMNS_CONFIG.map(col => {
        const setting = settingsData.documents.find(s => s.columnId === col.id);
        return {
          ...col,
          isEnabled: setting ? setting.isEnabled : true, // Default to enabled if no setting exists
        };
      });
      setDefaultColumns(updatedColumns);
    }
  }, [settingsData, projectId]);

  const saveSettingsToDatabase = (columns: DefaultColumn[]) => {
    // Don't save if projectId is not provided
    if (!projectId) return;
    
    const settings = columns.map(col => ({
      columnId: col.id,
      isEnabled: col.isEnabled,
    }));

    updateSettings({
      json: {
        workspaceId,
        projectId,
        settings,
      },
    });
  };

  const toggleColumn = (columnId: TaskStatus) => {
    const updated = defaultColumns.map(col => 
      col.id === columnId ? { ...col, isEnabled: !col.isEnabled } : col
    );
    
    setDefaultColumns(updated);
    saveSettingsToDatabase(updated);
  };

  const enableColumn = (columnId: TaskStatus) => {
    const updated = defaultColumns.map(col => 
      col.id === columnId ? { ...col, isEnabled: true } : col
    );
    
    setDefaultColumns(updated);
    saveSettingsToDatabase(updated);
  };

  const disableColumn = (columnId: TaskStatus) => {
    const updated = defaultColumns.map(col => 
      col.id === columnId ? { ...col, isEnabled: false } : col
    );
    
    setDefaultColumns(updated);
    saveSettingsToDatabase(updated);
    
    // Return true to indicate tasks may need to be moved
    return true;
  };

  const resetColumns = () => {
    const defaultState = DEFAULT_COLUMNS_CONFIG.map(col => ({ ...col, isEnabled: true }));
    
    setDefaultColumns(defaultState);
    saveSettingsToDatabase(defaultState);
  };

  const getEnabledColumns = useMemo(() => defaultColumns.filter(col => col.isEnabled), [defaultColumns]);
  const getDisabledColumns = useMemo(() => defaultColumns.filter(col => !col.isEnabled), [defaultColumns]);

  return {
    defaultColumns,
    toggleColumn,
    enableColumn,
    disableColumn,
    resetColumns,
    getEnabledColumns,
    getDisabledColumns,
    isLoading,
  };
};
