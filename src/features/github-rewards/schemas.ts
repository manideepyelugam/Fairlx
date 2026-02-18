import { z } from "zod";

// ===============================
// Coupon Redemption Schemas
// ===============================

/**
 * Schema for redeeming a GitHub star reward coupon.
 *
 * Validates format: FAIRLX- followed by 6-10 alphanumeric uppercase chars.
 * Accepts optional organizationId to resolve org vs personal wallet.
 */
export const redeemCouponSchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, "Coupon code is required")
        .transform((v) => v.toUpperCase())
        .refine(
            (v) => /^FAIRLX-[A-Z0-9]{6,10}$/.test(v),
            "Invalid coupon code format. Expected: FAIRLX-XXXXXXXX"
        ),
    workspaceId: z.string().optional(),
    organizationId: z.string().optional(),
});

export type RedeemCouponInput = z.infer<typeof redeemCouponSchema>;
