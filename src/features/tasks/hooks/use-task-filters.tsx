import { parseAsString, parseAsArrayOf, useQueryStates } from "nuqs";

// Use parseAsString for status to allow both enum values and custom column IDs
export const useTaskFilters = () => {
  return useQueryStates({
    projectId: parseAsString,
    status: parseAsString,
    assigneeId: parseAsString, // Keep for backward compatibility
    assigneeIds: parseAsArrayOf(parseAsString), // New field for multiple assignees
    search: parseAsString,
    dueDate: parseAsString,
    priority: parseAsString,
    labels: parseAsArrayOf(parseAsString),
  });
};
