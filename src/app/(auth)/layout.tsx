"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/api/use-logout";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const pathname = usePathname();
  const isSignIn = pathname === "/sign-in";
  const isOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  // For onboarding pages, use a minimal layout with logout option
  if (isOnboarding) {
    return (
      <main className="bg-background min-h-screen">
        <div className="mx-auto max-w-screen-2xl p-4">
          <nav className="flex justify-between items-center">
            <Link href="/">
              <Image src="/Logo.png" alt="logo" width={50} height={39} />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </nav>
          <div className="flex flex-col items-center justify-center pt-4 md:pt-8">
            {children}
          </div>
        </div>
      </main>
    );
  }

  // Default auth layout for sign-in/sign-up pages
  return (
    <main className="bg-neutral-100 min-h-screen">
      <div className="mx-auto max-w-screen-2xl p-4">
        <nav className="flex justify-between items-center">
          <Link href="/">
            <Image src="/Logo.png" alt="logo" width={50} height={39} />
          </Link>
          <Button asChild variant="secondary">
            <Link href={isSignIn ? "/sign-up" : "/sign-in"}>
              {isSignIn ? "Sign Up" : "Login"}
            </Link>
          </Button>
        </nav>
        <div className="flex flex-col items-center justify-center pt-4 md:pt-14">
          {children}
        </div>
      </div>
    </main>
  );
};

export default AuthLayout;
