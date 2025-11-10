import React from 'react'
import { ProfileClient } from '@/features/auth/components/password-info'
import { getCurrent } from "@/features/auth/queries";
import { redirect } from "next/navigation";

const page = async () => {
     const user = await getCurrent();
    
      if (!user) {
        redirect("/sign-in");
      }

  return (
    <ProfileClient initialData={user} />)
}

export default page