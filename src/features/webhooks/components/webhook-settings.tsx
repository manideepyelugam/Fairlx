"use client";

import { PlusIcon } from "lucide-react";

import { useGetWebhooks } from "../api/use-get-webhooks";
import { Button } from "@/components/ui/button";
import { DottedSeparator } from "@/components/dotted-separator";
import { useCreateWebhookModal } from "../hooks/use-create-webhook-modal";
import { WebhookList } from "./webhook-list";
import { CreateWebhookModal } from "./create-webhook-modal";
import { EditWebhookModal } from "./edit-webhook-modal";


interface WebhookSettingsProps {
    projectId: string;
}

export const WebhookSettings = ({ projectId }: WebhookSettingsProps) => {
    const { open } = useCreateWebhookModal();
    const { data: webhooks, isLoading } = useGetWebhooks(projectId);

    return (
        <div className="flex flex-col gap-y-4">
            <CreateWebhookModal projectId={projectId} />
            <EditWebhookModal projectId={projectId} />

            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">Webhooks</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure external integrations to receive real-time project events.
                    </p>
                </div>
                <Button onClick={open} size="sm">
                    <PlusIcon className="size-4 mr-2" />
                    Add Webhook
                </Button>
            </div>
            <DottedSeparator className="my-4" />
            <WebhookList
                projectId={projectId}
                webhooks={webhooks || []}
                isLoading={isLoading}
            />
        </div>
    );
};
