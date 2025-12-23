import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required."),
});

/**
 * Registration schema with account type selection
 * 
 * WHY: Signup must require account type selection (per spec).
 * PERSONAL → exactly ONE workspace created
 * ORG → organization + default workspace created
 */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  accountType: z.enum(["PERSONAL", "ORG"]).default("PERSONAL"),
  organizationName: z.string().trim().max(128, "Organization name too long.").optional(),
}).refine(
  (data) => {
    // If ORG account, organizationName is required
    if (data.accountType === "ORG" && (!data.organizationName || data.organizationName.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Organization name is required for organization accounts.",
    path: ["organizationName"],
  }
);

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
