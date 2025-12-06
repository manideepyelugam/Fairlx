"use client";

import { useQueryState, parseAsBoolean } from "nuqs";

export const useCreateWorkflowModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "create-workflow",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  );

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return { isOpen, open, close, setIsOpen };
};
