"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

interface ResponsiveModalProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResponsiveModal = ({ children, open, onOpenChange }: ResponsiveModalProps) => {
  // Decide variant only once (no live media re-evaluation) to prevent Presence churn
  const variant = React.useRef<"desktop" | "mobile">(
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
      ? "desktop"
      : "mobile"
  ).current;

  // Guard wrapper to avoid redundant callbacks
  const handleChange = React.useCallback(
    (next: boolean) => {
      if (next === open) return; // no-op if unchanged
      onOpenChange(next);
    },
    [open, onOpenChange]
  );

  if (process.env.NODE_ENV !== "production") {
    // Light dev-only instrumentation (comment out if noisy)
  // Debug logging removed
  }

  if (variant === "desktop") {
    return (
      <Dialog open={open} onOpenChange={handleChange}>
        <DialogContent className="w-full sm:max-w-lg p-0 border-none overflow-y-auto hide-scrollbar max-h-[85vh]">
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleChange}>
      <DrawerContent>
        <div className="overflow-y-auto hide-scrollbar max-h-[85vh]">{children}</div>
      </DrawerContent>
    </Drawer>
  );
};
