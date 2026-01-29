// Re-export all API hooks
export { useGetPrograms } from "./use-get-programs";
export { useGetProgram } from "./use-get-program";
export { useCreateProgram } from "./use-create-program";
export { useUpdateProgram } from "./use-update-program";
export { useDeleteProgram } from "./use-delete-program";
export { useGetProgramTeams } from "./use-get-program-teams";

export { useGetProgramMembers } from "./use-get-program-members";
export { useAddProgramMember } from "./use-add-program-member";
export { useUpdateProgramMember, useUpdateProgramMemberRole } from "./use-update-program-member";
export { useRemoveProgramMember } from "./use-remove-program-member";

export { useGetProgramProjects } from "./use-get-program-projects";
export { useGetAvailableProjects } from "./use-get-available-projects";
export { useLinkProjectToProgram } from "./use-link-project-to-program";
export { useUnlinkProjectFromProgram } from "./use-unlink-project-from-program";

export { useGetProgramMilestones } from "./use-get-program-milestones";
export { useCreateMilestone } from "./use-create-milestone";
export { useUpdateMilestone } from "./use-update-milestone";
export { useDeleteMilestone } from "./use-delete-milestone";
export { useReorderMilestones } from "./use-reorder-milestones";

export { useGetProgramAnalytics } from "./use-get-program-analytics";
export { useGetProgramSummary } from "./use-get-program-summary";

// Re-export types from API hooks
export type { GetProgramProjectsResponse } from "./use-get-program-projects";
export type { GetAvailableProjectsResponse } from "./use-get-available-projects";
export type { GetProgramMilestonesResponse } from "./use-get-program-milestones";
export type { GetProgramSummaryResponse } from "./use-get-program-summary";
