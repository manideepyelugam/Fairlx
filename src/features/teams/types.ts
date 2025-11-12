import { Models } from "node-appwrite";

// Team Visibility Options
export enum TeamVisibility {
  ALL = "ALL", // Visible to all workspace members
  PROGRAM_ONLY = "PROGRAM_ONLY", // Visible only to program members
  TEAM_ONLY = "TEAM_ONLY", // Visible only to team members
}

// Team Member Role
export enum TeamMemberRole {
  LEAD = "LEAD", // Team lead with additional permissions
  MEMBER = "MEMBER", // Regular team member
}

// Team Member Availability
export enum TeamMemberAvailability {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACTOR = "CONTRACTOR",
}

// Base Team type (from Appwrite)
export type Team = Models.Document & {
  name: string;
  description?: string;
  workspaceId: string;
  programId?: string;
  teamLeadId?: string;
  imageUrl?: string;
  visibility: TeamVisibility;
  createdBy: string;
  lastModifiedBy?: string;
};

// Team Member type (from Appwrite)
export type TeamMember = Models.Document & {
  teamId: string;
  memberId: string; // References members collection (userId)
  role: TeamMemberRole;
  availability: TeamMemberAvailability;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  lastModifiedBy?: string;
};

// Populated Team with additional data
export type PopulatedTeam = Team & {
  // Team lead information
  teamLead?: {
    $id: string;
    userId: string;
    name: string;
    email: string;
    profileImageUrl?: string;
  };
  // Program information
  program?: {
    $id: string;
    name: string;
    description?: string;
  };
  // Team statistics
  memberCount?: number;
  activeTaskCount?: number;
  completedTaskCount?: number;
};

// Populated Team Member with user details
export type PopulatedTeamMember = TeamMember & {
  // User information from members collection
  user: {
    $id: string;
    userId: string;
    name: string;
    email: string;
    profileImageUrl?: string;
    role: string; // Workspace role (ADMIN/MEMBER)
  };
  // Team information
  team: {
    $id: string;
    name: string;
    imageUrl?: string;
  };
};

// Team with members list
export type TeamWithMembers = Team & {
  members: PopulatedTeamMember[];
  memberCount: number;
};

// Team analytics/statistics
export type TeamAnalytics = {
  teamId: string;
  teamName: string;
  totalMembers: number;
  activeMembers: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalTimeLogged: number; // in hours
  averageTaskCompletionTime: number; // in days
  velocity: number; // tasks completed per sprint
};

// Team capacity planning
export type TeamCapacity = {
  teamId: string;
  teamName: string;
  totalCapacity: number; // total hours available
  allocatedCapacity: number; // hours allocated to tasks
  availableCapacity: number; // remaining hours
  utilizationRate: number; // percentage (0-100)
  members: Array<{
    memberId: string;
    name: string;
    availability: TeamMemberAvailability;
    capacity: number;
    allocated: number;
    available: number;
  }>;
};

// Team performance metrics
export type TeamPerformance = {
  teamId: string;
  period: string; // e.g., "2024-Q1" or "Sprint 5"
  tasksCompleted: number;
  tasksCreated: number;
  averageCompletionTime: number;
  velocity: number;
  burndownRate: number;
  qualityScore: number; // based on bugs/rework
};

// Create/Update Team DTOs
export type CreateTeamData = {
  name: string;
  description?: string;
  workspaceId: string;
  programId?: string;
  teamLeadId?: string;
  imageUrl?: string;
  visibility?: TeamVisibility;
};

export type UpdateTeamData = Partial<CreateTeamData>;

// Create/Update Team Member DTOs
export type AddTeamMemberData = {
  teamId: string;
  memberId: string;
  role?: TeamMemberRole;
  availability?: TeamMemberAvailability;
};

export type UpdateTeamMemberData = {
  role?: TeamMemberRole;
  availability?: TeamMemberAvailability;
  isActive?: boolean;
};

// Team filter/query options
export type TeamFilters = {
  workspaceId?: string;
  programId?: string;
  visibility?: TeamVisibility;
  teamLeadId?: string;
  search?: string;
};

// Team member filter/query options
export type TeamMemberFilters = {
  teamId?: string;
  memberId?: string;
  role?: TeamMemberRole;
  availability?: TeamMemberAvailability;
  isActive?: boolean;
};
