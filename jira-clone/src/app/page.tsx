import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TestComp } from "@/features/test";
import { Input } from "@/components/ui/input";

export default function Home() {
  return ( 
    <div className="">
      <Input />
      <Button size="xs" >
        Primary
      </Button>
      <Button variant="secondary">
        Secondary
      </Button>
      <Button variant="destructive">
        Destructive
      </Button>
      <Button variant="ghost">
        Ghost
      </Button>
      <Button variant="muted">
        Muted
      </Button>
      <Button variant="teritary">
      Teritary
      </Button>
    </div>
   );
}
