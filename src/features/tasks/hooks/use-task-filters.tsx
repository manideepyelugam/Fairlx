import { parseAsString, useQueryStates } from "nuqs";

import { TaskStatus } from "../types";

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
