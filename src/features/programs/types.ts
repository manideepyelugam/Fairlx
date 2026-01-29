import { Models } from "node-appwrite";

// Program Status
export enum ProgramStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// Program Member Role
export enum ProgramMemberRole {
  LEAD = "LEAD",        // Full control, can manage program
  ADMIN = "ADMIN",      // Can manage projects and members
  MEMBER = "MEMBER",    // Can view and update assigned items
  VIEWER = "VIEWER",    // Read-only access
}

// Program Priority
export enum ProgramPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Milestone Status
export enum MilestoneStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DELAYED = "DELAYED",
}

// Base Program type (from Appwrite)
export type Program = Models.Document & {
  name: string;
  description?: string;
  workspaceId: string;
  programLeadId?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  status: ProgramStatus;
  createdBy: string;
  lastModifiedBy?: string;
  // Enhanced fields
  color?: string;
  icon?: string;
  budget?: number;
  tags?: string[];
  priority?: ProgramPriority;
};

// Program Member
export type ProgramMember = Models.Document & {
  programId: string;
  workspaceId: string;
  userId: string;
  role: ProgramMemberRole;
  addedBy: string;
  addedAt: string;
};

// Populated Program Member (with user details)
export type PopulatedProgramMember = ProgramMember & {
  user: {
    $id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
  };
};

// Program Milestone
export type ProgramMilestone = Models.Document & {
  programId: string;
  name: string;
  description?: string | null;
  targetDate?: string | null;
  status: MilestoneStatus;
  progress: number;
  createdBy: string;
  position: number;
};

// Populated Program with additional data
export type PopulatedProgram = Program & {
  // Program lead information
  programLead?: {
    $id: string;
    userId: string;
    name: string;
    email: string;
    profileImageUrl?: string;
  } | null;
  // Program statistics
  memberCount?: number;
  projectCount?: number;
  activeTaskCount?: number;
  completedTaskCount?: number;
  milestoneCount?: number;
  completedMilestoneCount?: number;
  progress?: number;
};

// Linked project in program context
export type LinkedProject = {
  $id: string;
  name: string;
  key: string;
  status: string;
  imageUrl?: string;
  taskCount: number;
  completedTaskCount: number;
  progress: number; // percentage 0-100
};

// Program with full details (for detail page)
export type ProgramWithDetails = Program & {
  programLead?: {
    $id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
  };
  members: PopulatedProgramMember[];
  projects: LinkedProject[];
  milestones: ProgramMilestone[];
  analytics: ProgramAnalytics;
};

// Program analytics/statistics (enhanced)
export type ProgramAnalytics = {
  programId: string;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  totalMembers: number;
  totalMilestones: number;
  completedMilestones: number;
  overallProgress: number; // 0-100
  burndownData?: Array<{ date: string; remaining: number; ideal: number }>;
  velocityTrend?: Array<{ week: string; points: number }>;
};

// Create/Update Program DTOs
export type CreateProgramData = {
  name: string;
  description?: string;
  workspaceId: string;
  programLeadId?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  status?: ProgramStatus;
  color?: string;
  icon?: string;
  budget?: number;
  tags?: string[];
  priority?: ProgramPriority;
};

export type UpdateProgramData = Partial<CreateProgramData> & {
  status?: ProgramStatus;
};

// Program Member DTOs
export type AddProgramMemberData = {
  programId: string;
  userId: string;
  role: ProgramMemberRole;
};

export type UpdateProgramMemberData = {
  role: ProgramMemberRole;
};

// Program Milestone DTOs
export type CreateMilestoneData = {
  programId: string;
  name: string;
  description?: string;
  targetDate?: string;
  status?: MilestoneStatus;
};

export type UpdateMilestoneData = {
  name?: string;
  description?: string;
  targetDate?: string | null;
  status?: MilestoneStatus;
  progress?: number;
  position?: number;
};

// Program filter/query options
export type ProgramFilters = {
  workspaceId?: string;
  status?: ProgramStatus;
  programLeadId?: string;
  search?: string;
  priority?: ProgramPriority;
};
