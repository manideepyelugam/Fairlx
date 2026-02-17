import * as OTPAuth from "otpauth";

interface SetupTotpResult {
    secret: string;
    uri: string;
}

/**
 * Generates a new TOTP secret and QR code URI
 * 
 * @param email - User's email to include in the TOTP URI
 * @param issuer - App name (e.g., Fairlx)
 */
export function setupTotp(email: string, issuer: string = "Fairlx"): SetupTotpResult {
    // Generate a random 20-byte secret (standard for TOTP)
    const totp = new OTPAuth.TOTP({
        issuer,
        label: email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
    });

    const secret = totp.secret.base32;
    const uri = totp.toString();

    return {
        secret,
        uri,
    };
}
