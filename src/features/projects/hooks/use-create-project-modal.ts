import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";

export const useCreateProjectModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "create-project",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  );
  
  const [spaceId, setSpaceId] = useQueryState(
    "create-project-space",
    parseAsString.withOptions({ clearOnDefault: true })
  );

  const open = (initialSpaceId?: string) => {
    if (initialSpaceId) {
      setSpaceId(initialSpaceId);
    }
    setIsOpen(true);
  };
  
  const close = () => {
    setIsOpen(false);
    setSpaceId(null);
  };

  return {
    isOpen,
    open,
    close,
    setIsOpen,
    spaceId,
  };
};
