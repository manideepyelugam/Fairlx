"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SpaceAvatarProps {
  image?: string;
  name: string;
  className?: string;
  fallbackClassName?: string;
  color?: string;
}

export const SpaceAvatar = ({
  image,
  name,
  className,
  fallbackClassName,
  color,
}: SpaceAvatarProps) => {
  if (image) {
    return (
      <div
        className={cn(
          "size-5 relative rounded overflow-hidden",
          className
        )}
      >
        <Image src={image} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <Avatar className={cn("size-5 rounded", className)}>
      <AvatarFallback
        className={cn(
          "text-white font-semibold text-sm uppercase rounded",
          fallbackClassName
        )}
        style={{ backgroundColor: color || "#6366f1" }}
      >
        {name.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
};
