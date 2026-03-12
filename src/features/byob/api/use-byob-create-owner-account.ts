import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface CreateOwnerAccountRequest {
    orgSlug: string;
    name: string;
    email: string;
    password: string;
    acceptedTerms: true;
    acceptedDPA: true;
}

interface CreateOwnerAccountResponse {
    success: boolean;
    message?: string;
    orgSlug?: string;
    orgName?: string;
    error?: string;
    alreadyExists?: boolean;
}

export const useBYOBCreateOwnerAccount = () => {
    const router = useRouter();

    return useMutation<CreateOwnerAccountResponse, Error, CreateOwnerAccountRequest>({
        mutationFn: async (data) => {
            const response = await fetch("/api/byob/create-owner-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Account creation failed");
            return json;
        },
        onSuccess: (data) => {
            toast.success(
                data.message || "Account created! Check your email to verify."
            );
            if (data.orgSlug) {
                router.push(`/${data.orgSlug}/sign-in?registered=1`);
            }
        },
        onError: (err) => {
            toast.error(err.message || "Failed to create account. Please try again.");
        },
    });
};
