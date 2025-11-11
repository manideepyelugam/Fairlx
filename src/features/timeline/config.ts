/**
 * Timeline Feature Configuration
 * Centralized configuration for performance and data limits
 */

export const TIMELINE_CONFIG = {
  // Data fetch limits to prevent overload
  limits: {
    maxSprints: 100,
    maxWorkItems: 1000,
    maxChildren: 50, // Max children per work item to display
  },

  // Cache settings
  cache: {
    timelineDataTTL: 60, // seconds
    assigneeTTL: 300, // seconds (5 minutes)
  },

  // Grid defaults
  grid: {
    rowHeight: 48,
    headerHeight: 60,
    minColumnWidth: 100,
  },

  // Performance thresholds
  performance: {
    // Show warning if dataset exceeds these values
    warningThresholds: {
      workItems: 500,
      sprints: 50,
    },
    // Enable virtual scrolling if dataset exceeds these values
    virtualScrollThresholds: {
      workItems: 200,
      flatItems: 300,
    },
  },

  // Feature flags
  features: {
    enableVirtualScroll: true,
    enableAssigneeAvatars: true,
    enableProgressBars: true,
    enableDragAndDrop: true,
  },
} as const;

export type TimelineConfig = typeof TIMELINE_CONFIG;
