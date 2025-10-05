import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required."),
});

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
