import { Databases, ID, Query } from "node-appwrite";
import { DATABASE_ID, USER_RECOVERY_CODES_ID, EMAIL_OTP_CODES_ID } from "@/config";
import { UserRecoveryCode, EmailOtpCode } from "./types";

export class TwoFactorRepository {
    constructor(private databases: Databases) { }

    async createRecoveryCodes(userId: string, codeHashes: string[]): Promise<void> {
        const promises = codeHashes.map((hash) =>
            this.databases.createDocument(DATABASE_ID, USER_RECOVERY_CODES_ID, ID.unique(), {
                userId,
                codeHash: hash,
                used: false,
                createdAt: new Date().toISOString(),
            })
        );
        await Promise.all(promises);
    }

    async getValidRecoveryCode(userId: string, codeHash: string): Promise<UserRecoveryCode | null> {
        const result = await this.databases.listDocuments(DATABASE_ID, USER_RECOVERY_CODES_ID, [
            Query.equal("userId", userId),
            Query.equal("codeHash", codeHash),
            Query.equal("used", false),
        ]);

        if (result.total === 0) return null;
        return result.documents[0] as unknown as UserRecoveryCode;
    }

    async markRecoveryCodeUsed(codeId: string): Promise<void> {
        await this.databases.updateDocument(DATABASE_ID, USER_RECOVERY_CODES_ID, codeId, {
            used: true,
            usedAt: new Date().toISOString(),
        });
    }

    async storeEmailOtp(userId: string, codeHash: string, expiresAt: Date): Promise<void> {
        // Invalidate old OTPs first
        const oldOtps = await this.databases.listDocuments(DATABASE_ID, EMAIL_OTP_CODES_ID, [
            Query.equal("userId", userId)
        ]);

        // Cleanup old OTPs (basic sequential for now, can be optimized)
        for (const doc of oldOtps.documents) {
            await this.databases.deleteDocument(DATABASE_ID, EMAIL_OTP_CODES_ID, doc.$id);
        }

        await this.databases.createDocument(DATABASE_ID, EMAIL_OTP_CODES_ID, ID.unique(), {
            userId,
            codeHash,
            expiresAt: expiresAt.toISOString(),
            attempts: 0,
            createdAt: new Date().toISOString(),
        });
    }

    async getEmailOtp(userId: string): Promise<EmailOtpCode | null> {
        const result = await this.databases.listDocuments(DATABASE_ID, EMAIL_OTP_CODES_ID, [
            Query.equal("userId", userId),
        ]);

        if (result.total === 0) return null;
        return result.documents[0] as unknown as EmailOtpCode;
    }

    async incrementOtpAttempts(otpId: string, currentAttempts: number): Promise<void> {
        await this.databases.updateDocument(DATABASE_ID, EMAIL_OTP_CODES_ID, otpId, {
            attempts: currentAttempts + 1,
        });
    }

    async deleteEmailOtp(otpId: string): Promise<void> {
        await this.databases.deleteDocument(DATABASE_ID, EMAIL_OTP_CODES_ID, otpId);
    }

    async deleteAllRecoveryCodes(userId: string): Promise<void> {
        const result = await this.databases.listDocuments(DATABASE_ID, USER_RECOVERY_CODES_ID, [
            Query.equal("userId", userId),
        ]);

        const promises = result.documents.map((doc) =>
            this.databases.deleteDocument(DATABASE_ID, USER_RECOVERY_CODES_ID, doc.$id)
        );
        await Promise.all(promises);
    }
}
