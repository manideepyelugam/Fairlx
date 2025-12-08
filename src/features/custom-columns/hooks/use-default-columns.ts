"use client";

import { useState, useEffect, useMemo } from "react";
import { TaskStatus } from "@/features/tasks/types";
import { useGetDefaultColumnSettings } from "@/features/default-column-settings/api/use-get-default-column-settings";
import { useUpdateDefaultColumnSettings } from "@/features/default-column-settings/api/use-update-default-column-settings";

export interface DefaultColumn {
  id: TaskStatus;
  name: string;
  isEnabled: boolean;
  position?: number;
}

const DEFAULT_COLUMNS_CONFIG: Omit<DefaultColumn, 'isEnabled' | 'position'>[] = [
  { id: TaskStatus.TODO, name: "To Do" },
  { id: TaskStatus.ASSIGNED, name: "Assigned" },
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
    // Initialize with all columns enabled by default with position
    return DEFAULT_COLUMNS_CONFIG.map((col, index) => ({ 
      ...col, 
      isEnabled: true,
      position: (index + 1) * 1000 
    }));
  });

  // Update local state when database data loads
  useEffect(() => {
    if (settingsData?.documents && projectId) {
      const updatedColumns = DEFAULT_COLUMNS_CONFIG.map((col, index) => {
        const setting = settingsData.documents.find(s => s.columnId === col.id);
        return {
          ...col,
          isEnabled: setting ? setting.isEnabled : true, // Default to enabled if no setting exists
          position: setting?.position || (index + 1) * 1000,
        };
      });
      
      // Sort by position
      updatedColumns.sort((a, b) => (a.position || 0) - (b.position || 0));
      setDefaultColumns(updatedColumns);
    }
  }, [settingsData, projectId]);

  const saveSettingsToDatabase = (columns: DefaultColumn[]) => {
    // Don't save if projectId is not provided
    if (!projectId) return;
    
    const settings = columns.map(col => ({
      columnId: col.id,
      isEnabled: col.isEnabled,
      position: col.position,
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
    const defaultState = DEFAULT_COLUMNS_CONFIG.map((col, index) => ({ 
      ...col, 
      isEnabled: true,
      position: (index + 1) * 1000 
    }));
    
    setDefaultColumns(defaultState);
    saveSettingsToDatabase(defaultState);
  };

  const getEnabledColumns = useMemo(() => {
    return defaultColumns
      .filter(col => col.isEnabled)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [defaultColumns]);
  
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
