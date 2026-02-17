export enum TwoFactorMethod {
    TOTP = "TOTP",
    EMAIL = "EMAIL",
    BOTH = "BOTH",
}

export interface UserTwoFactorPrefs {
    twoFactorEnabled: boolean;
    twoFactorMethod?: TwoFactorMethod;
    totpSecret?: string; // Encrypted
    twoFactorEnabledAt?: string;
}

export interface UserRecoveryCode {
    $id: string;
    userId: string;
    codeHash: string;
    used: boolean;
    usedAt?: string;
    createdAt: string;
}

export interface EmailOtpCode {
    $id: string;
    userId: string;
    codeHash: string;
    expiresAt: string;
    attempts: number;
    createdAt: string;
}

export interface TwoFactorResult {
    success: boolean;
    error?: string;
    recoveryCodes?: string[];
}
