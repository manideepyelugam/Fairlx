"use client";

import { useState, useCallback } from "react";

interface SpaceWorkflowsModalState {
  isOpen: boolean;
  spaceId: string | null;
}

export const useSpaceWorkflowsModal = () => {
  const [state, setState] = useState<SpaceWorkflowsModalState>({
    isOpen: false,
    spaceId: null,
  });

  const open = useCallback((spaceId: string) => {
    setState({ isOpen: true, spaceId });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, spaceId: null });
  }, []);

  const setIsOpen = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setState({ isOpen: false, spaceId: null });
    }
  }, []);

  return {
    isOpen: state.isOpen,
    spaceId: state.spaceId,
    open,
    close,
    setIsOpen,
  };
};
