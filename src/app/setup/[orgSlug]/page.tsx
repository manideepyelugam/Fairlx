import Image from "next/image";
import Link from "next/link";

import { SetupStepper } from "@/features/byob/components/SetupStepper";

interface SetupPageProps {
    params: Promise<{ orgSlug: string }>;
}

const SetupPage = async ({ params }: SetupPageProps) => {
    const { orgSlug } = await params;

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto max-w-screen-xl p-4">
                {/* Header */}
                <nav className="flex justify-between items-center mb-8">
                    <Link href="/">
                        <Image
                            src="/Logo.png"
                            alt="Fairlx"
                            width={50}
                            height={39}
                        />
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Already set up?</span>
                        <Link
                            href="/sign-in"
                            className="text-blue-600 hover:underline"
                        >
                            Sign in
                        </Link>
                    </div>
                </nav>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Set Up Your Backend
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                        Connect your own Appwrite instance to use Fairlx with
                        your infrastructure. We&apos;ll set up all the
                        collections and storage buckets automatically.
                    </p>
                </div>

                {/* Stepper */}
                <SetupStepper initialSlug={orgSlug} />
            </div>
        </main>
    );
};

export default SetupPage;
