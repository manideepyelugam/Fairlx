import Image from "next/image";
import Link from "next/link";

import { DottedSeparator } from "./dotted-separator";
import { Navigation } from "./navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Projects } from "./projects";

export const Sidebar = () => {
  return (
    <aside className="h-full bg-neutral-50 w-full overflow-hidden border-r-[1.5px] border-neutral-200 ">
      <div className="flex flex-col justify-between h-[83%]">
        <div>
           <div className="flex items-center  w-full py-5 px-4 border-b-[1.5px] border-neutral-200 ">
        <Link href="/" >
          <Image src="/logo.png" className="object-contain " alt="logo" width={80} height={90} />
        </Link>
      </div>
      <Navigation />
      <Projects />
        </div>

      </div>
     
      <WorkspaceSwitcher />

    </aside>
  );
};
