import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// Use same-origin in the browser (relative URL) to work in Codespaces/any host.
// Fall back to absolute URL from env only on the server.
const baseUrl =
	typeof window === "undefined"
		? process.env.NEXT_PUBLIC_APP_URL ?? ""
		: ""; // relative => same-origin

export const client = hc<AppType>(baseUrl);
