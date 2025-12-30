import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export interface LinkedIdentity {
    id: string;
    provider: string;
    email: string;
    linkedAt: string;
}

export interface IdentitiesData {
    identities: LinkedIdentity[];
    hasPassword: boolean;
    totalMethods: number;
    canUnlink: boolean;
}

/**
 * Hook to fetch linked OAuth identities for current user
 * 
 * Returns:
 * - identities: Array of linked OAuth providers
 * - hasPassword: Whether user has password auth
 * - canUnlink: Whether unlinking is allowed (requires 2+ methods)
 */
export const useGetIdentities = () => {
    return useQuery({
        queryKey: ["identities"],
        queryFn: async (): Promise<IdentitiesData> => {
            const response = await client.api.auth.identities.$get();

            if (!response.ok) {
                throw new Error("Failed to fetch identities");
            }

            const result = await response.json();
            return result.data as IdentitiesData;
        },
    });
};
