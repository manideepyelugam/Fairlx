"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Layers } from "lucide-react";

interface ProgramAvatarProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: "h-5 w-5 text-[8px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-14 w-14 text-base",
};

const iconSizes = {
  xs: "h-2.5 w-2.5",
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-7 w-7",
};

// Generate a consistent color based on the program name
function getColorFromName(name: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(/[\s-_]+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProgramAvatar({
  name,
  imageUrl,
  className,
  size = "md",
  showTooltip = false,
}: ProgramAvatarProps) {
  const avatar = (
    <Avatar
      className={cn(
        sizeClasses[size],
        "ring-2 ring-background",
        className
      )}
    >
      {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
      <AvatarFallback
        className={cn(
          "font-semibold text-white",
          getColorFromName(name)
        )}
      >
        {name ? (
          getInitials(name)
        ) : (
          <Layers className={iconSizes[size]} />
        )}
      </AvatarFallback>
    </Avatar>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{avatar}</TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatar;
}

interface ProgramAvatarGroupProps {
  programs: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
  }>;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function ProgramAvatarGroup({
  programs,
  max = 3,
  size = "sm",
  className,
}: ProgramAvatarGroupProps) {
  const displayedPrograms = programs.slice(0, max);
  const remaining = programs.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayedPrograms.map((program) => (
        <ProgramAvatar
          key={program.id}
          name={program.name}
          imageUrl={program.imageUrl}
          size={size}
          showTooltip
        />
      ))}
      {remaining > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar
                className={cn(
                  sizeClasses[size],
                  "ring-2 ring-background bg-muted cursor-default"
                )}
              >
                <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                  +{remaining}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {programs.slice(max).map((program) => (
                  <p key={program.id} className="text-sm">
                    {program.name}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
