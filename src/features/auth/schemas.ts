import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required."),
});

/**
 * Registration schema - simplified for POST-AUTH account type selection
 * 
 * WHY: Account type is now selected AFTER authentication in onboarding.
 * This allows OAuth users to also select their account type.
 * The same email resolves to the same user regardless of auth method.
 */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});


export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
});

export const uploadProfileImageSchema = z.object({
  file: z.instanceof(File),
});

export const verifyEmailSchema = z.object({
  userId: z.string(),
  secret: z.string(),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  userId: z.string(),
  secret: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});
