import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";

export const useCreateLinkModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "create-link",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  );
  
  const [sourceWorkItemId, setSourceWorkItemId] = useQueryState(
    "link-source",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true })
  );

  const open = (workItemId?: string) => {
    if (workItemId) {
      setSourceWorkItemId(workItemId);
    }
    setIsOpen(true);
  };
  
  const close = () => {
    setIsOpen(false);
    setSourceWorkItemId("");
  };

  return {
    isOpen,
    sourceWorkItemId,
    open,
    close,
    setIsOpen,
  };
};
