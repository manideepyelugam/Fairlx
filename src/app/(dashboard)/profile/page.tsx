import { getCurrent } from "@/features/auth/queries";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/features/auth/components/profile-client";

const ProfilePage = async () => {
  const user = await getCurrent();

  if (!user) {
    redirect("/sign-in");
  }

  return <ProfileClient initialData={user} />;
};

export default ProfilePage;
