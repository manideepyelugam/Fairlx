import { z } from "zod";
import { TwoFactorMethod } from "./types";

export const enableTotpSchema = z.object({
    code: z.string().length(6, "Code must be 6 digits"),
    secret: z.string(), // Encrypted secret from setup step
});

export const enableEmailOtpSchema = z.object({
    code: z.string().length(6, "Code must be 6 digits"),
    email: z.string().email(),
});

export const verify2FASchema = z.object({
    code: z.string().min(6, "Code must be at least 6 characters"),
    method: z.nativeEnum(TwoFactorMethod).optional(),
    isRecoveryCode: z.boolean().optional().default(false),
    tempToken: z.string(), // Token from initial login
});

export const sendEmailOtpSchema = z.object({
    email: z.string().email(),
    tempToken: z.string().optional(),
});

export const disable2FASchema = z.object({
    password: z.string().min(1, "Password is required to disable 2FA"),
    method: z.nativeEnum(TwoFactorMethod).optional(),
});
