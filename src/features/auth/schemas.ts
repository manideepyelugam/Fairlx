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


// Working domain options for enterprise users
export const workingDomainOptions = [
  "FinTech",
  "E-Commerce",
  "HRMS",
  "Healthcare",
  "SaaS",
  "EdTech",
  "Gaming",
  "AI/ML",
  "Blockchain",
  "Other"
] as const;

export type WorkingDomain = typeof workingDomainOptions[number];

// Role options for professional profile
export const roleOptions = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Mobile Developer",
  "DevOps Engineer",
  "Data Engineer",
  "ML Engineer",
  "QA Engineer",
  "UI/UX Designer",
  "Product Designer",
  "Product Manager",
  "Project Manager",
  "Scrum Master",
  "Tech Lead",
  "Engineering Manager",
  "CTO",
  "CEO",
  "Other"
] as const;

export type RoleOption = typeof roleOptions[number];

// Designation options for professional profile
export const designationOptions = [
  "Junior",
  "Associate",
  "Mid-Level",
  "Senior",
  "Staff",
  "Principal",
  "Lead",
  "Manager",
  "Senior Manager",
  "Director",
  "Senior Director",
  "VP",
  "SVP",
  "C-Level",
  "Founder"
] as const;

export type DesignationOption = typeof designationOptions[number];

export const updateProfileSchema = z.object({
  // Basic profile
  name: z.string().trim().min(1, "Name is required."),

  // Professional profile fields (all optional)
  phoneNumber: z.string().optional().nullable(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().nullable().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().nullable().or(z.literal("")),
  workingDomain: z.enum(workingDomainOptions).optional().nullable(),
  role: z.enum(roleOptions).optional().nullable(),
  designation: z.enum(designationOptions).optional().nullable(),
  toolsAndTechnologies: z.array(z.string()).optional().nullable(), // Tag chips
});

export const uploadProfileImageSchema = z.object({
  file: z.instanceof(File),
});

export const verifyEmailSchema = z.object({
  userId: z.string(),
  secret: z.string().optional(),
  token: z.string().optional(),
  custom: z.union([z.string(), z.boolean()]).optional(),
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

export const firstLoginSchema = z.object({
  token: z.string().min(1, "Token is required."),
});
