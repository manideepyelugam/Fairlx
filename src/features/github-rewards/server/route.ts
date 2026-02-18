import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";

import { redeemCouponSchema } from "../schemas";
import { redeemCoupon } from "./redeemCoupon";
import { CouponError } from "./errors";

// ============================================================================
// GITHUB REWARDS API ROUTES
// ============================================================================

const app = new Hono()

    // ==============================================
    // POST /redeem — Redeem a GitHub Star Reward Coupon
    // ==============================================
    .post(
        "/redeem",
        sessionMiddleware,
        zValidator("json", redeemCouponSchema),
        async (c) => {
            const user = c.get("user");
            const { code, organizationId } = c.req.valid("json");

            try {
                const result = await redeemCoupon(user.$id, user.name, { code, organizationId });

                return c.json(result, 200);
            } catch (error) {
                // Map CouponError subclasses to HTTP status codes
                if (error instanceof CouponError) {
                    return c.json(
                        {
                            success: false,
                            error: error.errorCode,
                            message: error.message,
                        },
                        error.statusCode as 400 | 403 | 404 | 409 | 410 | 422 | 429
                    );
                }

                // Unexpected error
                console.error("[github-rewards] Unexpected error:", error);
                return c.json(
                    {
                        success: false,
                        error: "SERVER_ERROR",
                        message: "An unexpected error occurred. Please try again.",
                    },
                    500
                );
            }
        }
    );

export default app;
