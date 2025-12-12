import { useQueryState, parseAsString } from "nuqs";

export const useTaskPreviewModal = () => {
  const [taskId, setTaskId] = useQueryState("task-preview", parseAsString);

  const open = (id: string) => setTaskId(id);
  const close = () => setTaskId(null);

  return {
    taskId,
    open,
    close,
    setTaskId,
  };
};
