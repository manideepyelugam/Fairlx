"use client";

import { UserButton } from "@/features/auth/components/user-button";

import { usePathname } from "next/navigation";

import { MobileSidebar } from "./mobile-sidebar";
import { Breadcrumb } from "./breadcrumb";

const pathnameMap = {
  tasks: {
    title: "My Tasks",
    description: "View all of your tasks here.",
  },
  projects: {
    title: "My Project",
    description: "View tasks of your project here.",
  },
  "time-tracking": {
    title: "Time Tracking",
    description: "Track time, view timesheets, and analyze estimates vs actuals.",
  },
};

const defaultMap = {
  title: "Home",
  description: "Monitor all of your projects and tasks here.",
};

export const Navbar = () => {
  const pathname = usePathname();
  const pathnameParts = pathname.split("/");
  const pathnameKey = pathnameParts[3] as keyof typeof pathnameMap;

  const { title, description } = pathnameMap[pathnameKey] || defaultMap;

  return (
    <nav className="py-[15px] px-6 flex items-center border-b border-neutral-200 sticky top-0 left-0 right-0 z-10 justify-between bg-white">
      <div className="flex flex-col ">
        <div className="hidden lg:flex">
          <Breadcrumb />
        </div>
        <div className="flex lg:hidden">
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </div>
      <MobileSidebar />
      <UserButton />
    </nav>
  );
};
