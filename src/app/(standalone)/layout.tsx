"use client";

import { AccountLifecycleProvider } from "@/components/account-lifecycle-provider";

interface StandaloneLayoutProps {
  children: React.ReactNode;
}

const StandaloneLayout = ({ children }: StandaloneLayoutProps) => {
  return (
    <AccountLifecycleProvider>
      <main className="bg-neutral-100 min-h-screen">
        <div className="mx-auto max-w-screen-2xl ">


          
       
          <div className="">
            {children}
          </div>
        </div>
      </main>
    </AccountLifecycleProvider>
  );
};

export default StandaloneLayout;
