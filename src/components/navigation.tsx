"use client";

import { cn } from "@/lib/utils";
import { SettingsIcon, UsersIcon, ClockIcon, Layers } from "lucide-react";
import Link from "next/link";
import {
  GoCheckCircle,
  GoCheckCircleFill,
  GoHome,
  GoHomeFill,
} from "react-icons/go";

import { usePathname } from "next/navigation";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

const routes = [
  {
    label: "Home",
    href: "",
    icon: GoHome,
    activeIcon: GoHomeFill,
  },
  {
    label: "My Tasks",
    href: "/tasks",
    icon: GoCheckCircle,
    activeIcon: GoCheckCircleFill,
  },
  {
    label: "My Backlog",
    href: "/my-backlog",
    icon: Layers,
    activeIcon: Layers,
  },
  {
    label: "Time Tracking",
    href: "/time-tracking",
    icon: ClockIcon,
    activeIcon: ClockIcon,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: SettingsIcon,
    activeIcon: SettingsIcon,
  },
  {
    label: "Members",
    href: "/members",
    icon: UsersIcon,
    activeIcon: UsersIcon,
  },
];

export const Navigation = () => {
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();

  return (
    <div className="p-3 border-b-[1.5px] border-neutral-200 flex-shrink-0">
      <ul className="flex flex-col ">
        {routes.map((item) => {
          const fullHref = `/workspaces/${workspaceId}${item.href}`;
          const isActive = pathname === fullHref;
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <div key={item.href}>

              <Link href={fullHref}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-md font-medium  transition text-neutral-500",
                    isActive && "bg-neutral-200 shadow-sm hover:opacity-100 text-primary"
                  )}
                >
                  <Icon className={cn("size-5 text-neutral-500", isActive && "text-primary")} />
                  <p className="text-[13px] tracking-tight font-medium">
                    {item.label}
                  </p>
                </div>
              </Link>
            </div>

          );
        })}
      </ul>
    </div>

  );
};
