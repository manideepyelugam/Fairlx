import { parseAsString, useQueryStates } from "nuqs";

// Use parseAsString for status to allow both enum values and custom column IDs
export const useTaskFilters = () => {
  return useQueryStates({
    projectId: parseAsString,
    status: parseAsString,
    assigneeId: parseAsString,
    search: parseAsString,
    dueDate: parseAsString,
  });
};
