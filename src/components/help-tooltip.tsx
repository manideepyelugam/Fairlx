"use client";

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: React.ReactNode;
  className?: string;
  iconClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export const HelpTooltip = ({ 
  content, 
  className, 
  iconClassName,
  side = "top",
  align = "center"
}: HelpTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
              className
            )}
          >
            <HelpCircle className={cn("h-4 w-4", iconClassName)} />
            <span className="sr-only">Help</span>
          </button>
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-xs"
          side={side}
          align={align}
          sideOffset={8}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
