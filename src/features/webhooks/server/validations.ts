import { z } from "zod";
import { WebhookEventType } from "./types";

export const createWebhookSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    url: z.string().url("Invalid URL").refine((url) => {
        try {
            const parsedUrl = new URL(url);
            // SSRF Protection: Block common private IP ranges and localhost
            const host = parsedUrl.hostname.toLowerCase();

            const isPrivate =
                host === "localhost" ||
                host === "127.0.0.1" ||
                host === "0.0.0.0" ||
                host.startsWith("10.") ||
                host.startsWith("192.168.") ||
                host.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./);

            return !isPrivate;
        } catch {
            return false;
        }
    }, {
        message: "Invalid webhook URL: Internal or private IPs are not allowed.",
    }),
    events: z.array(z.nativeEnum(WebhookEventType)).min(1, "At least one event must be selected"),
    secret: z.string().max(255).optional().nullable(),
    enabled: z.boolean().default(true),
});

export const updateWebhookSchema = createWebhookSchema.partial();

export const deleteWebhookSchema = z.object({
    webhookId: z.string(),
});
