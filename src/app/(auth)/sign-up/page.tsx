import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { SignUpCard } from "@/features/auth/components/sign-up-card";

const SignUpPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string }>;
}) => {
  const user = await getCurrent();
  const params = await searchParams;

  if (user) {
    const returnUrl = params.returnUrl;
    if (returnUrl) {
      redirect(returnUrl);
    }
    redirect("/");
  }

  return <SignUpCard returnUrl={params.returnUrl} />;
};

export default SignUpPage;
