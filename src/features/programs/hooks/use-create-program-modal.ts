import { useQueryState, parseAsBoolean } from "nuqs";

export const useCreateProgramModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "create-program",
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
