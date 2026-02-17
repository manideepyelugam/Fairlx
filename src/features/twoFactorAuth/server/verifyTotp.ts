import * as OTPAuth from "otpauth";
import { decryptSecret } from "./security";

/**
 * Verifies a TOTP code against an encrypted secret
 * 
 * @param code - The 6-digit code provided by the user
 * @param encryptedSecret - The encrypted TOTP secret stored in the user's profile
 */
export function verifyTotp(code: string, encryptedSecret: string): boolean {
    try {
        const secret = decryptSecret(encryptedSecret);

        const totp = new OTPAuth.TOTP({
            secret: secret,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
        });

        // Validate with drift 1 (allows ±30 seconds)
        const delta = totp.validate({
            token: code,
            window: 1,
        });

        return delta !== null;
    } catch (error) {
        console.error("TOTP verification error:", error);
        return false;
    }
}
