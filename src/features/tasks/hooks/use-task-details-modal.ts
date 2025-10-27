import { useQueryState, parseAsString } from "nuqs";

export const useTaskDetailsModal = () => {
  const [taskId, setTaskId] = useQueryState("task-details", parseAsString);

  const open = (id: string) => setTaskId(id);
  const close = () => setTaskId(null);

  return {
    taskId,
    open,
    close,
    setTaskId,
  };
};
