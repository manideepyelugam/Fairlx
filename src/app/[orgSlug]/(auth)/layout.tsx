"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BYOBAuthLayoutProps {
  children: React.ReactNode;
}

/**
 * BYOB Auth Layout
 * 
 * Mirrors Cloud (auth)/layout.tsx but handles BYOB-namespaced paths.
 * For onboarding pages under /{orgSlug}/onboarding, use a clean full-screen layout.
 */
const BYOBAuthLayout = ({ children }: BYOBAuthLayoutProps) => {
  const pathname = usePathname();
  const isOnboarding = pathname.includes("/onboarding");

  // For onboarding pages, use a completely clean full-screen layout (no header)
  if (isOnboarding) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  // Default auth layout for other auth pages
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-screen-2xl p-4">
        <nav className="flex justify-between items-center">
          <Link href="/">
            <Image src="/Logo.png" alt="logo" width={50} height={39} />
          </Link>
          <Button asChild variant="secondary">
            <Link href="/sign-in">Login</Link>
          </Button>
        </nav>
        <div className="flex flex-col items-center justify-center pt-4 md:pt-14">
          {children}
        </div>
      </div>
    </main>
  );
};

export default BYOBAuthLayout;
