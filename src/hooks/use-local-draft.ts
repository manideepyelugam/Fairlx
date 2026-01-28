"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DRAFT_PREFIX = "task_draft_";
const SYNC_DELAY = 30000; // 30 seconds of inactivity as backup (primary sync is on blur/close)

interface DraftData {
  content: string;
  taskId: string;
  timestamp: number;
}

interface UseLocalDraftOptions {
  taskId: string;
  initialContent: string;
  onSync: (content: string) => Promise<void> | void;
}

/**
 * Hook for local-first draft management
 * - Stores content in localStorage as user types
 * - Syncs to server after 10 seconds of inactivity
 * - Syncs on blur/close and clears draft
 * - Handles page unload to ensure no data loss
 */
export const useLocalDraft = ({
  taskId,
  initialContent,
  onSync,
}: UseLocalDraftOptions) => {
  const storageKey = `${DRAFT_PREFIX}${taskId}`;
  
  // Get initial value from localStorage (preferred) or server
  const getInitialValue = (): string => {
    if (typeof window === "undefined") return initialContent;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const draft: DraftData = JSON.parse(saved);
        // Use draft if it's for this task and newer than 24 hours
        // Always prefer localStorage draft over server content (it's more recent)
        if (draft.taskId === taskId && Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          return draft.content;
        }
      }
    } catch {
      // Invalid JSON, ignore
    }
    return initialContent;
  };

  const [content, setContent] = useState(getInitialValue);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedContentRef = useRef(initialContent);
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);
  const contentRef = useRef(content); // Track latest content for unmount sync

  // Re-check localStorage on mount (component might remount with same taskId)
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const storedValue = getInitialValue();
      if (storedValue !== content && storedValue !== initialContent) {
        setContent(storedValue);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to normalize HTML for comparison
  const normalizeHtml = (html: string): string => {
    if (!html) return "";
    return html
      .replace(/<p><\/p>/g, "")
      .replace(/<br\s*\/?>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Save to localStorage
  const saveDraft = useCallback((newContent: string) => {
    if (typeof window === "undefined") return;
    
    try {
      const draft: DraftData = {
        content: newContent,
        taskId,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      // localStorage full or unavailable
    }
  }, [taskId, storageKey]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore errors
    }
  }, [storageKey]);

  // Sync to server
  const syncToServer = useCallback(async (contentToSync: string) => {
    const currentNormalized = normalizeHtml(contentToSync);
    const lastSyncedNormalized = normalizeHtml(lastSyncedContentRef.current);

    // Don't sync if content hasn't changed
    if (currentNormalized === lastSyncedNormalized) {
      return;
    }

    setIsSyncing(true);
    try {
      await onSync(contentToSync);
      lastSyncedContentRef.current = contentToSync;
      setLastSynced(new Date());
      // Clear draft after successful sync
      clearDraft();
    } catch {
      // Keep draft in localStorage for retry
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [onSync, clearDraft]);

  // Schedule sync after delay
  const schedulSync = useCallback((newContent: string) => {
    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Schedule new sync
    syncTimeoutRef.current = setTimeout(() => {
      syncToServer(newContent);
    }, SYNC_DELAY);
  }, [syncToServer]);

  // Handle content change
  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    contentRef.current = newContent; // Update ref for unmount sync
    saveDraft(newContent);
    schedulSync(newContent);
  }, [saveDraft, schedulSync]);

  // Force sync now (for blur/close) - returns Promise so callers can await
  const syncNow = useCallback(async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    await syncToServer(content);
  }, [content, syncToServer]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save draft to localStorage (sync might not complete)
      saveDraft(content);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [content, saveDraft]);

  // Handle visibility change (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden, sync immediately
        syncNow();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncNow]);

  // Sync on unmount to ensure data is saved even on sudden close
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      // Sync to server on unmount - this handles sudden modal close
      const finalContent = contentRef.current;
      const currentNormalized = normalizeHtml(finalContent);
      const lastSyncedNormalized = normalizeHtml(lastSyncedContentRef.current);
      
      if (currentNormalized !== lastSyncedNormalized) {
        // Fire and forget - can't await in cleanup
        // Handle both sync and async onSync functions
        try {
          const result = onSync(finalContent);
          if (result instanceof Promise) {
            result.catch(() => {
              // Keep draft in localStorage for retry on next open
            });
          }
        } catch {
          // Keep draft in localStorage for retry on next open
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle task ID change
  const prevTaskIdRef = useRef(taskId);
  useEffect(() => {
    if (prevTaskIdRef.current !== taskId) {
      // Task changed, sync old content first, then load new
      syncToServer(content).then(() => {
        prevTaskIdRef.current = taskId;
        lastSyncedContentRef.current = initialContent;
        setContent(getInitialValue());
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  return {
    content,
    setContent: handleChange,
    isSyncing,
    lastSynced,
    syncNow,
    clearDraft,
  };
};

/**
 * Cleanup stale drafts older than 24 hours
 * Call this on app startup
 */
export const cleanupStaleDrafts = () => {
  if (typeof window === "undefined") return;

  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_PREFIX)) {
        try {
          const draft: DraftData = JSON.parse(localStorage.getItem(key) || "");
          if (now - draft.timestamp > 24 * 60 * 60 * 1000) {
            keysToRemove.push(key);
          }
        } catch {
          // Invalid JSON, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore errors
  }
};
