import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";

export const useEditProgramModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "edit-program",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  );

  const [programId, setProgramId] = useQueryState(
    "edit-program-id",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true })
  );

  const open = (id?: string) => {
    if (id) {
      setProgramId(id);
    }
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setProgramId("");
  };

  return {
    isOpen,
    programId,
    open,
    close,
    setIsOpen,
    setProgramId,
  };
};
