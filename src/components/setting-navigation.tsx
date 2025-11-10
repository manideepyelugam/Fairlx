"use client";

import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";
import Link from "next/link";
import {
  GoCheckCircle,
  GoCheckCircleFill,
  GoHome,
  GoHomeFill,

} from "react-icons/go";
import { CgProfile } from "react-icons/cg";
import { usePathname } from "next/navigation";


const routes = [
   {
    label: "Home",
    href: "/",
    icon: GoHome,
    activeIcon: GoHomeFill,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: CgProfile,
    activeIcon: CgProfile,
  },
  {
    label: "Account",
    href: "/profile/accountinfo",
    icon: GoCheckCircle,
    activeIcon: GoCheckCircleFill,
  },
  {
    label: "Security",
    href: "/profile/password",
    icon: Layers,
    activeIcon: Layers,
  },
  
];

export const Navigation = () => {
  const pathname = usePathname();

  return (
    <div className="p-3 border-b-[1.5px] border-neutral-200 flex-shrink-0">
      <ul className="flex flex-col ">
        {routes.map((item) => {

         const fullHref = `${item.href}`;
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
