import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";

export const useCreateWorkItemModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "create-work-item",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  );

  const [projectId, setProjectId] = useQueryState(
    "work-item-project",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true })
  );

  const open = (projectId?: string) => {
    if (projectId) {
      setProjectId(projectId);
    }
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setProjectId("");
  };

  return {
    isOpen,
    projectId,
    open,
    close,
    setIsOpen,
  };
};
