import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MemberAvatarProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
  withTooltip?: boolean;
  tooltipText?: string;
}

export const MemberAvatar = ({
  name,
  imageUrl,
  className,
  fallbackClassName,
  withTooltip = true,
  tooltipText,
}: MemberAvatarProps) => {
  const displayName = name?.trim() || "Unknown member";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  const avatar = (
    <Avatar
      className={cn(
        "size-5 transition border border-neutral-300 rounded-full overflow-hidden",
        className
      )}
    >
      {imageUrl ? <AvatarImage src={imageUrl} alt={displayName} /> : null}
      <AvatarFallback
        className={cn(
          "bg-neutral-200 font-medium text-neutral-500 flex items-center justify-center",
          fallbackClassName
        )}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );

  if (!withTooltip) {
    return avatar;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{avatar}</TooltipTrigger>
        <TooltipContent side="top">
          <span className="text-sm font-medium leading-none">
            {tooltipText || displayName}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
