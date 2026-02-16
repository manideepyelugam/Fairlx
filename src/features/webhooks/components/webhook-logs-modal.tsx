"use client";

import { format } from "date-fns";
import { CheckCircle2Icon, XCircleIcon, InfoIcon } from "lucide-react";

import { ResponsiveModal } from "@/components/responsive-modal";
import { useWebhookLogsModal } from "../hooks/use-webhook-logs-modal";
import { useGetWebhookDeliveries } from "../api/use-get-webhook-deliveries";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DottedSeparator } from "@/components/dotted-separator";
import { WebhookDeliveryStatus } from "../server/types";

interface WebhookLogsModalProps {
    projectId: string;
}

export const WebhookLogsModal = ({ projectId }: WebhookLogsModalProps) => {
    const { webhookId, isOpen, close } = useWebhookLogsModal();
    const { data: deliveries, isLoading } = useGetWebhookDeliveries(webhookId || "", projectId);

    return (
        <ResponsiveModal open={isOpen} onOpenChange={close}>
            <div className="p-4 sm:p-7 max-h-[80vh] flex flex-col">
                <div className="flex flex-col gap-y-1 mb-6">
                    <h2 className="text-xl font-bold">Delivery Logs</h2>
                    <p className="text-sm text-muted-foreground">
                        Recent event deliveries for this webhook.
                    </p>
                </div>
                <DottedSeparator className="mb-6" />

                <div className="flex-1 overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : deliveries?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <InfoIcon className="size-8 mb-2 opacity-20" />
                            <p className="text-sm">No delivery attempts yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {deliveries?.map((delivery) => (
                                <div key={delivery.$id} className="border rounded-lg p-4 bg-muted/5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex flex-col gap-y-1">
                                            <div className="flex items-center gap-x-2">
                                                <Badge variant="outline" className="font-mono text-[10px]">
                                                    {delivery.eventType}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(delivery.$createdAt), "MMM d, HH:mm:ss")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-x-2 mt-1">
                                                {delivery.status === WebhookDeliveryStatus.SUCCESS ? (
                                                    <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                                                ) : (
                                                    <XCircleIcon className="size-3.5 text-rose-500" />
                                                )}
                                                <span className={`text-xs font-semibold ${delivery.status === WebhookDeliveryStatus.SUCCESS ? "text-emerald-700" : "text-rose-700"
                                                    }`}>
                                                    {delivery.responseCode || "Failed"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Attempt {delivery.attempts}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {delivery.responseBody && (
                                        <div className="mt-2">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Response Body</p>
                                            <pre className="text-[10px] bg-black p-2 rounded overflow-x-auto text-emerald-400 font-mono max-h-24">
                                                {delivery.responseBody}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t flex justify-end">
                    <Button variant="outline" size="sm" onClick={close}>
                        Close
                    </Button>
                </div>
            </div>
        </ResponsiveModal>
    );
};

import { Button } from "@/components/ui/button";
