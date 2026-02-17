import { Databases, Messaging, ID } from "node-appwrite";
import { hashValue } from "./security";
import { TwoFactorRepository } from "./repository";

/**
 * Generates and sends a 6-digit Email OTP
 */
export async function sendEmailOtp(
    databases: Databases,
    messaging: Messaging,
    userId: string,
    _email: string
): Promise<void> {
    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = hashValue(otp);

    // Set expiration to 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const repository = new TwoFactorRepository(databases);
    await repository.storeEmailOtp(userId, codeHash, expiresAt);

    // Send email using Appwrite Messaging and branded template
    const { createAdminClient } = await import("@/lib/appwrite");
    const { messaging: adminMessaging } = await createAdminClient();

    const { twoFactorOtpTemplate } = await import("@/lib/email-templates/two-factor-otp");
    const emailHtml = twoFactorOtpTemplate({ otp });
    const subject = `${otp} is your Fairlx verification code`;

    await adminMessaging.createEmail(
        ID.unique(),
        subject,
        emailHtml,
        [], // topics
        [userId], // users
        [], // targets
        [], // cc
        [], // bcc
        [], // attachments
        false, // draft
        true // html
    );
}
