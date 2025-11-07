// Server-only configuration for GitHub integration and Gemini API.
// Do NOT import this file from client code; it reads server-side environment variables.

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

if (!GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY is not configured. Gemini features will fail until it is set.");
}

/**
 * Helper to assert at runtime that required server secrets are available.
 * Use in API routes before calling Gemini or GitHub endpoints.
 */
export function assertServerConfig() {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required on the server");
}

export function getGitHubAuthHeader() {
  return GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
}
