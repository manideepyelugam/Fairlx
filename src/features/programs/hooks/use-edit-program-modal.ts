import { useQueryState, parseAsBoolean } from "nuqs";

export const useEditProgramModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "edit-program",
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
