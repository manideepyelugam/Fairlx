import Image from "next/image";
import Link from "next/link";
import { Navigation } from "./setting-navigation";

export const ProfileSidebar = () => {
  return (
    <aside className="h-full bg-background w-full overflow-hidden border-r-[1.5px] border-border flex flex-col">
      <div className="flex items-center w-full py-5 px-4 border-b-[1.5px] border-border flex-shrink-0">
        <Link href="/" >
          <Image src="/Logo.png" className="object-contain " alt="logo" width={80} height={90} />
        </Link>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navigation />
      </div>


    </aside>
  );
};
