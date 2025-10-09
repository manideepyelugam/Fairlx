"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { MemberAvatar } from "@/features/members/components/member-avatar";

export interface AssigneeLike {
  $id: string;
  name?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
}

interface AssigneeAvatarGroupProps {
  assignees: AssigneeLike[];
  visibleCount?: number;
  avatarClassName?: string;
  fallbackClassName?: string;
  extraCountClassName?: string;
  triggerClassName?: string;
  popoverAlign?: "start" | "center" | "end";
  popoverClassName?: string;
  ariaLabel?: string;
}

export const AssigneeAvatarGroup = ({
  assignees,
  visibleCount = 3,
  avatarClassName = "size-6 border-2 border-white",
  fallbackClassName = "text-xs",
  extraCountClassName = "size-6 rounded-full bg-muted text-xs font-medium flex items-center justify-center border-2 border-white",
  triggerClassName,
  popoverAlign = "center",
  popoverClassName,
  ariaLabel,
}: AssigneeAvatarGroupProps) => {
  const [open, setOpen] = useState(false);
  const hoverTimeoutRef = useRef<number>();

  const displayAssignees = useMemo(
    () => assignees.filter((assignee): assignee is AssigneeLike => Boolean(assignee)),
    [assignees]
  );

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  if (displayAssignees.length === 0) {
    return null;
  }

  const visibleAssignees = displayAssignees.slice(0, visibleCount);
  const overflowCount = Math.max(displayAssignees.length - visibleCount, 0);

  const clearHoverTimeout = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = undefined;
    }
  };

  const handleOpen = () => {
    clearHoverTimeout();
    setOpen(true);
  };

  const handleClose = () => {
    clearHoverTimeout();
    hoverTimeoutRef.current = window.setTimeout(() => setOpen(false), 120);
  };

  const getDisplayName = (assignee: AssigneeLike) =>
    assignee.name?.trim() || assignee.email?.trim() || "Unknown member";

  const getDisplayEmail = (assignee: AssigneeLike) => assignee.email?.trim();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            ariaLabel || `View ${displayAssignees.length} assignees`
          }
          className={cn(
            "flex items-center -space-x-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            triggerClassName
          )}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          {visibleAssignees.map((assignee) => {
            const displayName = getDisplayName(assignee);

            return (
              <MemberAvatar
                key={assignee.$id}
                name={displayName}
                imageUrl={assignee.profileImageUrl ?? undefined}
                className={avatarClassName}
                fallbackClassName={fallbackClassName}
                withTooltip={false}
              />
            );
          })}
          {overflowCount > 0 ? (
            <div className={extraCountClassName}>+{overflowCount}</div>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={popoverAlign}
        className={cn("w-64 p-3", popoverClassName)}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
      >
        <div className="space-y-2">
          {displayAssignees.map((assignee) => {
            const displayName = getDisplayName(assignee);
            const displayEmail = getDisplayEmail(assignee);

            return (
              <div key={assignee.$id} className="flex items-center gap-2">
                <MemberAvatar
                  name={displayName}
                  imageUrl={assignee.profileImageUrl ?? undefined}
                  className="size-8"
                  fallbackClassName="text-sm"
                  withTooltip={false}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">
                    {displayName}
                  </span>
                  {displayEmail ? (
                    <span className="text-xs text-muted-foreground">
                      {displayEmail}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
