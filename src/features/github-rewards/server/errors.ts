/**
 * GitHub Reward Coupon Error Hierarchy
 *
 * Each error maps to a specific HTTP status code.
 * The route handler catches these and returns the correct status.
 */

export class CouponError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;

    constructor(message: string, statusCode: number, errorCode: string) {
        super(message);
        this.name = "CouponError";
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}

/** 400 — Coupon code missing or invalid format */
export class CouponInvalidError extends CouponError {
    constructor(message = "Invalid coupon code") {
        super(message, 400, "INVALID_COUPON");
    }
}

/** 404 — Coupon code does not exist in landing DB */
export class CouponNotFoundError extends CouponError {
    constructor(message = "Coupon code not found") {
        super(message, 404, "COUPON_NOT_FOUND");
    }
}

/** 410 — Coupon has expired */
export class CouponExpiredError extends CouponError {
    constructor(message = "This coupon has expired") {
        super(message, 410, "COUPON_EXPIRED");
    }
}

/** 409 — Coupon has already been redeemed */
export class CouponAlreadyRedeemedError extends CouponError {
    constructor(message = "This coupon has already been redeemed") {
        super(message, 409, "COUPON_ALREADY_REDEEMED");
    }
}

/** 403 — User not authorized (ownership mismatch or suspended) */
export class CouponOwnershipError extends CouponError {
    constructor(message = "You are not authorized to redeem this coupon") {
        super(message, 403, "COUPON_OWNERSHIP_MISMATCH");
    }
}

/** 403 — Billing account is suspended */
export class CouponSuspendedError extends CouponError {
    constructor(message = "Your account is suspended. Please resolve billing issues first.") {
        super(message, 403, "ACCOUNT_SUSPENDED");
    }
}

/** 422 — Reward amount is invalid (zero or negative) */
export class CouponInvalidAmountError extends CouponError {
    constructor(message = "Invalid reward amount") {
        super(message, 422, "INVALID_REWARD_AMOUNT");
    }
}

/** 429 — Too many failed redemption attempts */
export class CouponRateLimitError extends CouponError {
    constructor(message = "Too many redemption attempts. Please try again later.") {
        super(message, 429, "RATE_LIMIT_EXCEEDED");
    }
}
