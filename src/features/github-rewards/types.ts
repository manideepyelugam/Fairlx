/**
 * GitHub Star Reward Coupon Types
 *
 * These types mirror the Landing Page's Supabase `github_star_coupons` table.
 * The main app reads from this table to validate and redeem coupons,
 * then credits the user's wallet via the internal Appwrite wallet system.
 */

// ===============================
// Supabase Row Type (Landing DB)
// ===============================

/**
 * GitHubRewardCoupon — mirrors `github_star_coupons` table in landing Supabase
 *
 * INVARIANT: Each GitHub user gets exactly one coupon.
 * INVARIANT: Once `redeemed_at` is set, the coupon cannot be reused.
 */
export interface GitHubRewardCoupon {
    id: string;
    github_user_id: number;
    github_username: string;
    email: string | null;
    coupon_code: string;
    credit_amount: number;
    is_expired: boolean;
    redeemed_at: string | null;
    created_at: string;
    updated_at: string;
}

// ===============================
// Supabase RPC Response
// ===============================

export interface RedeemCouponRpcResult {
    success: boolean;
    message: string;
    github_username: string | null;
    credit_amount: number | null;
}

// ===============================
// API Response
// ===============================

export interface RedeemCouponResponse {
    success: true;
    creditedAmount: number;
    newWalletBalance: number;
    transactionId: string;
}

// ===============================
// Internal Events
// ===============================

export const EVENT_GITHUB_REWARD_REDEEMED = "GITHUB_REWARD_REDEEMED" as const;
