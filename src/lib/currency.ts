import "server-only";

/**
 * Currency Conversion Service
 * 
 * Provides live and cached exchange rates for billing calculations.
 * Usage is tracked in USD, but billed in INR.
 * 
 * DESIGN:
 * - Fetches live rates from a free API
 * - Caches rates for 1 hour to reduce API calls
 * - Falls back to static rate if API fails
 * - Provides both live lookup and bulk conversion
 */

// Default fallback rate if API fails (as of Jan 2026)
const DEFAULT_USD_TO_INR = 83.50;

// Cache for exchange rates
interface RateCache {
    rates: Record<string, number>;
    baseCurrency: string;
    fetchedAt: number;
    expiresAt: number;
}

let rateCache: RateCache | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Common currencies for the admin panel
export const SUPPORTED_CURRENCIES = [
    "USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "HKD",
    "SGD", "NZD", "KRW", "MXN", "BRL", "ZAR", "AED", "SAR", "THB", "MYR",
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

/**
 * Fetch live exchange rates
 * 
 * Uses exchangerate-api.com if EXCHANGE_RATE_API_KEY is configured.
 * Otherwise falls back to static rates (no API call).
 * 
 * Get a free API key at: https://www.exchangerate-api.com/
 */
async function fetchLiveRates(): Promise<Record<string, number> | null> {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;

    // If no API key configured, use static rates immediately
    if (!apiKey) {
        console.log("[Currency] No EXCHANGE_RATE_API_KEY configured, using static rates");
        return null;
    }

    try {
        const response = await fetch(
            `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) {
            console.error("[Currency] API response not OK:", response.status);
            return null;
        }

        const data = await response.json();

        if (data.result === "error") {
            console.error("[Currency] API returned error:", data);
            return null;
        }

        return data.conversion_rates;
    } catch (error) {
        console.error("[Currency] Failed to fetch live rates:", error);
        return null;
    }
}

/**
 * Get cached or fresh exchange rates
 */
export async function getExchangeRates(): Promise<RateCache> {
    const now = Date.now();

    // Return cached rates if still valid
    if (rateCache && rateCache.expiresAt > now) {
        return rateCache;
    }

    // Fetch fresh rates
    const liveRates = await fetchLiveRates();

    if (liveRates) {
        rateCache = {
            rates: liveRates,
            baseCurrency: "USD",
            fetchedAt: now,
            expiresAt: now + CACHE_DURATION_MS,
        };
        console.log("[Currency] Fetched fresh exchange rates");
    } else {
        // Use fallback static rates
        rateCache = {
            rates: {
                USD: 1,
                INR: DEFAULT_USD_TO_INR,
                EUR: 0.92,
                GBP: 0.79,
                JPY: 148.50,
                AUD: 1.54,
                CAD: 1.36,
                CHF: 0.88,
                CNY: 7.24,
                HKD: 7.81,
                SGD: 1.34,
                NZD: 1.63,
                KRW: 1320.00,
                MXN: 17.20,
                BRL: 4.97,
                ZAR: 18.90,
                AED: 3.67,
                SAR: 3.75,
                THB: 35.20,
                MYR: 4.48,
            },
            baseCurrency: "USD",
            fetchedAt: now,
            expiresAt: now + CACHE_DURATION_MS,
        };
        console.warn("[Currency] Using fallback static rates");
    }

    return rateCache;
}

/**
 * Get the USD to INR exchange rate
 */
export async function getUsdToInrRate(): Promise<number> {
    const cache = await getExchangeRates();
    return cache.rates.INR || DEFAULT_USD_TO_INR;
}

/**
 * Convert USD amount to INR
 */
export async function convertUsdToInr(amountUsd: number): Promise<number> {
    const rate = await getUsdToInrRate();
    return Math.round(amountUsd * rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    const cache = await getExchangeRates();

    // Convert to USD first (base currency), then to target
    const fromRate = cache.rates[fromCurrency] || 1;
    const toRate = cache.rates[toCurrency] || 1;

    const amountInUsd = amount / fromRate;
    const amountInTarget = amountInUsd * toRate;

    return Math.round(amountInTarget * 100) / 100;
}

/**
 * Get rates for multiple currencies at once (for admin panel)
 */
export async function getBulkRates(
    currencies: string[] = [...SUPPORTED_CURRENCIES]
): Promise<{
    baseCurrency: string;
    rates: Record<string, number>;
    fetchedAt: string;
    isLive: boolean;
}> {
    const cache = await getExchangeRates();

    const filteredRates: Record<string, number> = {};
    for (const currency of currencies) {
        if (cache.rates[currency] !== undefined) {
            filteredRates[currency] = cache.rates[currency];
        }
    }

    return {
        baseCurrency: cache.baseCurrency,
        rates: filteredRates,
        fetchedAt: new Date(cache.fetchedAt).toISOString(),
        isLive: cache.rates.INR !== DEFAULT_USD_TO_INR, // Simple check
    };
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
    amount: number,
    currency: string = "USD"
): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format amount for billing (amount in smallest unit like paise)
 */
export function formatBillingAmount(amountPaise: number): string {
    const rupees = amountPaise / 100;
    return formatCurrency(rupees, "INR");
}
