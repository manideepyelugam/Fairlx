import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { RewardsPageClient } from "./client";

export default async function RewardsPage() {
    const user = await getCurrent();

    if (!user) {
        redirect("/sign-in");
    }

    return <RewardsPageClient />;
}
