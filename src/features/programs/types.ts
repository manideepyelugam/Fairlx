import { Models } from "node-appwrite";

// Program Status
export enum ProgramStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
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
  };
  // Program statistics
  teamCount?: number;
  memberCount?: number;
  projectCount?: number;
  activeTaskCount?: number;
  completedTaskCount?: number;
};

// Program with teams list
export type ProgramWithTeams = Program & {
  teams: Array<{
    $id: string;
    name: string;
    imageUrl?: string;
    memberCount: number;
    teamLeadId?: string;
  }>;
  totalTeams: number;
  totalMembers: number;
};

// Program analytics/statistics
export type ProgramAnalytics = {
  programId: string;
  programName: string;
  totalTeams: number;
  totalMembers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  averageTeamSize: number;
  overallVelocity: number;
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
};

export type UpdateProgramData = Partial<CreateProgramData> & {
  status?: ProgramStatus;
};

// Program filter/query options
export type ProgramFilters = {
  workspaceId?: string;
  status?: ProgramStatus;
  programLeadId?: string;
  search?: string;
};
