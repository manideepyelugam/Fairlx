import "server-only";

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { sessionMiddleware } from "@/lib/session-middleware";
import {
    getBulkRates,
    convertCurrency,
    getUsdToInrRate,
    SUPPORTED_CURRENCIES,
    formatCurrency,
} from "@/lib/currency";

/**
 * Currency API Routes
 * 
 * Provides exchange rate information for the admin panel.
 * 
 * Endpoints:
 * - GET /currency/rates - Get all supported currency rates
 * - GET /currency/convert - Convert amount between currencies
 * - GET /currency/usd-to-inr - Get current USD to INR rate
 */

const convertSchema = z.object({
    amount: z.coerce.number().positive(),
    from: z.string().length(3).toUpperCase(),
    to: z.string().length(3).toUpperCase(),
});

const app = new Hono()
    /**
     * GET /currency/rates
     * Get all supported currency exchange rates
     */
    .get("/rates", sessionMiddleware, async (c) => {
        try {
            const rates = await getBulkRates();
            return c.json({
                data: {
                    ...rates,
                    supportedCurrencies: SUPPORTED_CURRENCIES,
                },
            });
        } catch {
            return c.json({ error: "Failed to fetch exchange rates" }, 500);
        }
    })

    /**
     * GET /currency/convert
     * Convert amount from one currency to another
     */
    .get(
        "/convert",
        sessionMiddleware,
        zValidator("query", convertSchema),
        async (c) => {
            const { amount, from, to } = c.req.valid("query");

            try {
                const convertedAmount = await convertCurrency(amount, from, to);
                const usdToInrRate = await getUsdToInrRate();

                return c.json({
                    data: {
                        originalAmount: amount,
                        originalCurrency: from,
                        convertedAmount,
                        targetCurrency: to,
                        formatted: formatCurrency(convertedAmount, to),
                        usdToInrRate, // Always include for reference
                    },
                });
            } catch {
                return c.json({ error: "Currency conversion failed" }, 500);
            }
        }
    )

    /**
     * GET /currency/usd-to-inr
     * Get current USD to INR rate (most common for billing)
     */
    .get("/usd-to-inr", sessionMiddleware, async (c) => {
        try {
            const rate = await getUsdToInrRate();
            const sample100Usd = rate * 100;

            return c.json({
                data: {
                    rate,
                    sample: {
                        usd: 100,
                        inr: sample100Usd,
                        formatted: {
                            usd: formatCurrency(100, "USD"),
                            inr: formatCurrency(sample100Usd, "INR"),
                        },
                    },
                },
            });
        } catch {
            return c.json({ error: "Failed to fetch exchange rate" }, 500);
        }
    });

export default app;
