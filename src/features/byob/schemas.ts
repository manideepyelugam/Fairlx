import { z } from "zod";
import { ORG_SLUG_REGEX } from "./constants";

// ===============================
// Reserved Slugs
// ===============================

/** Slugs that conflict with app routes — cannot be used as org slugs */
export const RESERVED_SLUGS = new Set([
    "sign-in", "sign-up", "onboarding", "welcome", "workspaces",
    "workspace", "organization", "org", "profile", "admin", "api",
    "setup", "auth", "oauth", "invite", "join", "verify-email",
    "billing", "settings", "403", "404", "500",
]);

// ===============================
// Register Tenant
// ===============================

export const registerSchema = z.object({
    orgSlug: z
        .string()
        .min(3, "Slug must be at least 3 characters")
        .max(48, "Slug must be at most 48 characters")
        .regex(
            ORG_SLUG_REGEX,
            "Slug must be lowercase alphanumeric with hyphens (e.g. my-company)"
        )
        .refine(
            (slug) => !RESERVED_SLUGS.has(slug),
            "This slug is reserved. Please choose a different name."
        ),
    orgName: z
        .string()
        .min(2, "Organisation name must be at least 2 characters")
        .max(128, "Organisation name must be at most 128 characters")
        .trim(),
});

// ===============================
// Validate Credentials
// ===============================

export const validateCredentialsSchema = z.object({
    endpoint: z
        .string()
        .url("Endpoint must be a valid URL")
        .startsWith("https://", "Endpoint must use HTTPS"),
    project: z
        .string()
        .min(1, "Project ID is required")
        .max(128, "Project ID too long"),
    apiKey: z
        .string()
        .min(1, "API key is required"),
});

// ===============================
// Initialize Database
// ===============================

export const initializeDbSchema = z.object({
    orgSlug: z
        .string()
        .min(3)
        .max(48)
        .regex(ORG_SLUG_REGEX),
    envVars: z.record(z.string(), z.string()),
});

// ===============================
// Resolve Org
// ===============================

export const resolveOrgSchema = z.object({
    orgSlug: z
        .string()
        .min(3)
        .max(48)
        .regex(ORG_SLUG_REGEX),
});

// ===============================
// Create Owner Account (Step 4)
// ===============================

export const createOwnerAccountSchema = z.object({
    orgSlug: z
        .string()
        .min(3)
        .max(48)
        .regex(ORG_SLUG_REGEX),
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    acceptedTerms: z.literal(true, {
        errorMap: () => ({ message: "You must accept the Terms of Service" }),
    }),
    acceptedDPA: z.literal(true, {
        errorMap: () => ({ message: "You must accept the Data Processing Agreement" }),
    }),
});
