import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { UsageDashboardClient } from "./client";

export default async function AdminUsagePage() {
    const user = await getCurrent();

    if (!user) {
        redirect("/sign-in");
    }

    return <UsageDashboardClient />;
}
