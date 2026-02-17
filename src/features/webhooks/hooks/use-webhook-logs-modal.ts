import { parseAsString, useQueryState } from "nuqs";

export const useWebhookLogsModal = () => {
    const [webhookId, setWebhookId] = useQueryState(
        "webhook-logs",
        parseAsString.withOptions({ clearOnDefault: true })
    );

    const open = (id: string) => setWebhookId(id);
    const close = () => setWebhookId(null);

    return {
        webhookId,
        open,
        close,
        isOpen: !!webhookId,
        setWebhookId,
    };
};
