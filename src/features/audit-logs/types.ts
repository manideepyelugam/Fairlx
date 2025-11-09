// Activity types from existing collections
export enum ActivityType {
  TASK = "task",
  PROJECT = "project",
  WORKSPACE = "workspace",
  MEMBER = "member",
  SPRINT = "sprint",
  WORK_ITEM = "work_item",
  TIME_LOG = "time_log",
  ATTACHMENT = "attachment",
  CUSTOM_COLUMN = "custom_column",
  BACKLOG_ITEM = "backlog_item",
  NOTIFICATION = "notification",
}

// Unified activity log from existing collections
export interface ActivityLog {
  id: string;
  type: ActivityType;
  action: "created" | "updated" | "deleted";
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userImageUrl?: string;
  workspaceId?: string;
  projectId?: string;
  entityId: string;
  entityName?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// For aggregated activity feed
export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  entity: {
    id: string;
    name: string;
    type: ActivityType;
  };
  workspace?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  changes?: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
}

// Statistics for dashboard
export interface ActivityStats {
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByUser: Record<string, number>;
  recentActivities: ActivityFeedItem[];
  mostActiveUsers: Array<{ userId: string; userName: string; count: number }>;
  activityTrend: Array<{ date: string; count: number }>;
}
