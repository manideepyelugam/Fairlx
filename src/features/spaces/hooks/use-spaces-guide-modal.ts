"use client";

import { useQueryState, parseAsBoolean } from "nuqs";

export const useSpacesGuideModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "spaces-guide",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  );

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return { isOpen, open, close, setIsOpen };
};
