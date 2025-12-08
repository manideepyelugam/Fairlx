"use client";

import { useQueryState, parseAsBoolean } from "nuqs";

export const useCreateCustomFieldModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "create-custom-field",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  );

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return { isOpen, open, close, setIsOpen };
};
