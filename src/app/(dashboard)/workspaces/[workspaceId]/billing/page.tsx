import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import { BillingDashboardClient } from "./client";

export default async function BillingPage() {
    const user = await getCurrent();

    if (!user) {
        redirect("/sign-in");
    }

    return <BillingDashboardClient />;
}
