"use client";

import { useQueryState, parseAsBoolean } from "nuqs";

export const useCreateSpaceModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "create-space",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  );

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return { isOpen, open, close, setIsOpen };
};
