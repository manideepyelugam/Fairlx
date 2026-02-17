export class TwoFactorError extends Error {
    constructor(public message: string, public code: string, public status: number = 400) {
        super(message);
        this.name = "TwoFactorError";
    }
}

export class InvalidOtpError extends TwoFactorError {
    constructor() {
        super("Invalid verification code. Please try again.", "INVALID_OTP", 400);
    }
}

export class ExpiredOtpError extends TwoFactorError {
    constructor() {
        super("The verification code has expired. Please request a new one.", "EXPIRED_OTP", 400);
    }
}

export class TooManyAttemptsError extends TwoFactorError {
    constructor() {
        super("Too many failed attempts. For security, please request a new code.", "TOO_MANY_ATTEMPTS", 400);
    }
}

export class ReauthRequiredError extends TwoFactorError {
    constructor() {
        super("Re-authentication required for this sensitive operation.", "REAUTH_REQUIRED", 401);
    }
}
