"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface IconHelpProps {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
  className?: string;
}

export const IconHelp = ({ content, side = "top", children, className }: IconHelpProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className={className}>{children}</TooltipTrigger>
        <TooltipContent className="text-[11px] px-2.5 py-1 shadow-sm border" side={side}>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default IconHelp;
