import { parseAsString, useQueryState } from "nuqs";

export const useEditWebhookModal = () => {
    const [webhookId, setWebhookId] = useQueryState(
        "edit-webhook",
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
