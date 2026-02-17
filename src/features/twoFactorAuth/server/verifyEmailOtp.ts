import { Databases } from "node-appwrite";
import { hashValue, constantTimeCompare } from "./security";
import { TwoFactorRepository } from "./repository";
import { InvalidOtpError, ExpiredOtpError, TooManyAttemptsError } from "./errors";

/**
 * Verifies an Email OTP code
 */
export async function verifyEmailOtp(
    databases: Databases,
    userId: string,
    code: string
): Promise<boolean> {
    const repository = new TwoFactorRepository(databases);
    const otpRecord = await repository.getEmailOtp(userId);

    if (!otpRecord) {
        throw new InvalidOtpError();
    }

    // Check if expired
    if (new Date(otpRecord.expiresAt) < new Date()) {
        await repository.deleteEmailOtp(otpRecord.$id);
        throw new ExpiredOtpError();
    }

    // Check attempts (max 5)
    if (otpRecord.attempts >= 5) {
        await repository.deleteEmailOtp(otpRecord.$id);
        throw new TooManyAttemptsError();
    }

    const codeHash = hashValue(code);
    const isValid = constantTimeCompare(codeHash, otpRecord.codeHash);

    if (!isValid) {
        await repository.incrementOtpAttempts(otpRecord.$id, otpRecord.attempts);
        throw new InvalidOtpError();
    }

    // Success - delete OTP
    await repository.deleteEmailOtp(otpRecord.$id);
    return true;
}
