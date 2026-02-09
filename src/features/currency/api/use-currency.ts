import { useQuery, useMutation } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

/**
 * Fetch all currency exchange rates
 */
export function useGetCurrencyRates() {
    return useQuery({
        queryKey: ["currency", "rates"],
        queryFn: async () => {
            const response = await client.api.currency.rates.$get();

            if (!response.ok) {
                throw new Error("Failed to fetch currency rates");
            }

            const json = await response.json();
            return json.data;
        },
        staleTime: 30 * 60 * 1000, // 30 minutes — exchange rates don't change frequently
        refetchInterval: 60 * 60 * 1000, // Refetch every 60 minutes (was 10 min)
    });
}

/**
 * Get USD to INR rate (most common for billing)
 */
export function useGetUsdToInrRate() {
    return useQuery({
        queryKey: ["currency", "usd-to-inr"],
        queryFn: async () => {
            const response = await client.api.currency["usd-to-inr"].$get();

            if (!response.ok) {
                throw new Error("Failed to fetch USD-INR rate");
            }

            const json = await response.json();
            return json.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Convert amount between currencies
 */
export function useConvertCurrency() {
    return useMutation({
        mutationFn: async (params: { amount: number; from: string; to: string }) => {
            const response = await client.api.currency.convert.$get({
                query: {
                    amount: params.amount.toString(),
                    from: params.from,
                    to: params.to,
                },
            });

            if (!response.ok) {
                throw new Error("Currency conversion failed");
            }

            const json = await response.json();
            return json.data;
        },
    });
}
