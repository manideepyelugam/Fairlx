"use client";

import { useCurrent } from "@/features/auth/api/use-current";
import { ProfileClient } from "@/features/auth/components/profile-client";
import { PageLoader } from "@/components/page-loader";

const ProfilePage = () => {
  const { data: user, isLoading } = useCurrent();

  if (isLoading || !user) return <PageLoader />;

  return <ProfileClient initialData={user} />;
};

export default ProfilePage;
