/**
 * Centralized React Query configuration
 * Defines default staleTime and cacheTime for different data types
 */

export const QUERY_CONFIG = {
  // Static/rarely changing data (workspaces, spaces, projects)
  STATIC: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  },
  
  // Semi-dynamic data (members, teams, workflows)
  SEMI_DYNAMIC: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Dynamic data (tasks, work items, notifications)
  DYNAMIC: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
  
  // Real-time data (activity logs, live updates)
  REALTIME: {
    staleTime: 0, // Always refetch
    gcTime: 1 * 60 * 1000, // 1 minute
  },
  
  // Analytics and reports
  ANALYTICS: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
} as const;
