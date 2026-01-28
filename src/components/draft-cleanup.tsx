"use client";

import { useEffect } from "react";
import { cleanupStaleDrafts } from "@/hooks/use-local-draft";

/**
 * Component that cleans up stale drafts from localStorage on mount.
 * Should be included once in the app layout.
 */
export const DraftCleanup = () => {
  useEffect(() => {
    cleanupStaleDrafts();
  }, []);

  return null;
};
