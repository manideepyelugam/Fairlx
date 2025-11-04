import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// Use same-origin in the browser (relative URL) to work in Codespaces/any host.
// Fall back to an absolute URL from env vars only on the server.
const getBaseUrl = () => {
	if (typeof window !== "undefined") {
		return ""; // Browser can use relative paths
	}

	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL;
	}

	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	if (process.env.PORT) {
		return `http://localhost:${process.env.PORT}`;
	}

	// Default to localhost when no env vars are provided.
	return "http://localhost:3000";
};

export const client = hc<AppType>(getBaseUrl());
