"use client";

import { useQueryState, parseAsBoolean } from "nuqs";

export const useManageColumnsModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "manage-columns",
    parseAsBoolean
      .withDefault(false)
      .withOptions({ clearOnDefault: true })
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
