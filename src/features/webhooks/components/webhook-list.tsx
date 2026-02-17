"use client";

import { MoreVerticalIcon, TrashIcon, SettingsIcon, ActivityIcon, SendIcon } from "lucide-react";
import { format } from "date-fns";

import { Webhook } from "../server/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskStatus } from "@/features/tasks/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteWebhook } from "../api/use-delete-webhook";
import { useTestWebhook } from "../api/use-test-webhook";
import { useConfirm } from "@/hooks/use-confirm";
import { useWebhookLogsModal } from "../hooks/use-webhook-logs-modal";
import { useEditWebhookModal } from "../hooks/use-edit-webhook-modal";
import { WebhookLogsModal } from "./webhook-logs-modal";



interface WebhookListProps {
    projectId: string;
    webhooks: Webhook[];
    isLoading: boolean;
}

export const WebhookList = ({
    projectId,
    webhooks,
    isLoading,
}: WebhookListProps) => {
    const { open: openLogs } = useWebhookLogsModal();
    const { open: openEdit } = useEditWebhookModal();
    const { mutate: deleteWebhook, isPending: isDeleting } = useDeleteWebhook();
    const { mutate: testWebhook, isPending: isTesting } = useTestWebhook();

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Webhook",
        "This action cannot be undone. You will stop receiving events at this URL.",
        "destructive"
    );

    const handleDelete = async (webhookId: string) => {
        const ok = await confirmDelete();
        if (ok) {
            deleteWebhook({ param: { webhookId }, query: { projectId } });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    if (webhooks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground">No webhooks configured.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-3">
            <DeleteDialog />
            <WebhookLogsModal projectId={projectId} />
            <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Name</th>
                            <th className="px-4 py-3 text-left font-medium">URL</th>
                            <th className="px-4 py-3 text-left font-medium">Events</th>
                            <th className="px-4 py-3 text-left font-medium">Last Run</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {webhooks.map((webhook) => (
                            <tr key={webhook.$id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-x-2">
                                        <span className="font-medium">{webhook.name}</span>
                                        <Badge variant={webhook.enabled ? TaskStatus.DONE : "secondary"} className="text-[10px] px-1.5 h-4">
                                            {webhook.enabled ? "Active" : "Disabled"}
                                        </Badge>
                                    </div>
                                </td>
                                <td className="px-4 py-4 truncate max-w-[200px]" title={webhook.url}>
                                    {webhook.url}
                                </td>
                                <td className="px-4 py-4">
                                    <Badge variant="outline" className="text-[10px]">
                                        {webhook.events.length} events
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {webhook.lastTriggeredAt
                                        ? format(new Date(webhook.lastTriggeredAt), "MMM d, HH:mm")
                                        : "Never"}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVerticalIcon className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEdit(webhook.$id)}>
                                                <SettingsIcon className="size-4 mr-2" />
                                                Edit Settings
                                            </DropdownMenuItem>

                                            <DropdownMenuItem onClick={() => openLogs(webhook.$id)}>
                                                <ActivityIcon className="size-4 mr-2" />
                                                View Logs
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => testWebhook({ param: { webhookId: webhook.$id }, json: { projectId } })} disabled={isTesting}>
                                                <SendIcon className="size-4 mr-2" />
                                                Ping / Test Webhook
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDelete(webhook.$id)}
                                                disabled={isDeleting}
                                            >
                                                <TrashIcon className="size-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
