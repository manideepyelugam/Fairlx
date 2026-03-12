"use client";

import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface RegisterMemberRequest {
    orgSlug: string;
    name: string;
    email: string;
    password: string;
    acceptedTerms: true;
    acceptedDPA: true;
}

interface RegisterMemberResponse {
    success: boolean;
    message?: string;
    orgName?: string;
    orgSlug?: string;
    error?: string;
}

export const useBYOBRegisterMember = () => {
    const router = useRouter();

    return useMutation<RegisterMemberResponse, Error, RegisterMemberRequest>({
        mutationFn: async (data) => {
            const response = await fetch("/api/byob/register-member", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.error || "Registration failed");
            }

            return json;
        },
        onSuccess: (data) => {
            toast.success(
                data.message ||
                    "Account created! Please check your email to verify."
            );
            // Redirect to the BYOB sign-in page
            if (data.orgSlug) {
                router.push(
                    `/${data.orgSlug}/sign-in?registered=1`
                );
            }
        },
        onError: (err) => {
            toast.error(err.message || "Registration failed. Please try again.");
        },
    });
};
