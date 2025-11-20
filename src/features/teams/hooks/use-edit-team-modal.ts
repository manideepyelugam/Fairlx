import { useQueryState, parseAsBoolean } from "nuqs";

export const useEditTeamModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "edit-team",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  );

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    open,
    close,
    setIsOpen,
  };
};
