"use client";

// Shared modal state via URL query param (mirrors task modal pattern) so
// every invocation of this hook references the same open state.
// This avoids duplicate local state instances that previously prevented
// the trigger button from controlling the rendered modal component.

import { useQueryState, parseAsBoolean } from "nuqs";

export const useCreateCustomColumnModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "create-custom-column",
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
