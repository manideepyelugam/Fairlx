"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpacesGuide } from "./spaces-guide";
import { useSpacesGuideModal } from "../hooks/use-spaces-guide-modal";

export const SpacesGuideModal = () => {
  const { isOpen, setIsOpen } = useSpacesGuideModal();

  const handleOpenChange = (next: boolean) => {
    if (next === isOpen) return;
    setIsOpen(next);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange}>
      <ScrollArea className="max-h-[80vh]">
        <div className="p-4">
          <SpacesGuide />
        </div>
      </ScrollArea>
    </ResponsiveModal>
  );
};
