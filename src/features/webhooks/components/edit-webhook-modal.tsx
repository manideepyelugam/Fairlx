"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { ResponsiveModal } from "@/components/responsive-modal";
import { useEditWebhookModal } from "../hooks/use-edit-webhook-modal";
import { updateWebhookSchema } from "../server/validations";
import { useUpdateWebhook } from "../api/use-update-webhook";
import { useGetWebhooks } from "../api/use-get-webhooks";
import { WebhookEventType } from "../server/types";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { DottedSeparator } from "@/components/dotted-separator";

interface EditWebhookModalProps {
    projectId: string;
}

export const EditWebhookModal = ({ projectId }: EditWebhookModalProps) => {
    const { webhookId, isOpen, close } = useEditWebhookModal();
    const { data: webhooks } = useGetWebhooks(projectId);
    const { mutate, isPending } = useUpdateWebhook();

    const webhook = webhooks?.find((w) => w.$id === webhookId);

    const form = useForm<z.infer<typeof updateWebhookSchema>>({
        resolver: zodResolver(updateWebhookSchema),
        defaultValues: {
            name: "",
            url: "",
            events: [],
            secret: "",
            enabled: true,
        },
    });

    useEffect(() => {
        if (webhook) {
            form.reset({
                name: webhook.name,
                url: webhook.url,
                events: webhook.events,
                secret: webhook.secret || "",
                enabled: webhook.enabled,
            });
        }
    }, [webhook, form]);

    const onSubmit = (values: z.infer<typeof updateWebhookSchema>) => {
        if (!webhookId) return;

        mutate({
            param: { webhookId },
            json: {
                ...values,
                projectId,
            },
        }, {
            onSuccess: () => {
                close();
            },
        });
    };

    const eventOptions = [
        { value: WebhookEventType.TASK_CREATED, label: "Task Created" },
        { value: WebhookEventType.TASK_UPDATED, label: "Task Updated" },
        { value: WebhookEventType.TASK_COMPLETED, label: "Task Completed" },
        { value: WebhookEventType.TASK_DELETED, label: "Task Deleted" },
        { value: WebhookEventType.TASK_ASSIGNED, label: "Task Assigned" },
        { value: WebhookEventType.TASK_UNASSIGNED, label: "Task Unassigned" },
        { value: WebhookEventType.STATUS_CHANGED, label: "Status Changed" },
        { value: WebhookEventType.PRIORITY_CHANGED, label: "Priority Changed" },
        { value: WebhookEventType.DUE_DATE_CHANGED, label: "Due Date Changed" },
        { value: WebhookEventType.COMMENT_ADDED, label: "Comment Added" },
        { value: WebhookEventType.REPLY_ADDED, label: "Reply Added" },
        { value: WebhookEventType.WORKITEM_MENTIONED, label: "User Mentioned" },
        { value: WebhookEventType.ATTACHMENT_ADDED, label: "Attachment Added" },
        { value: WebhookEventType.ATTACHMENT_DELETED, label: "Attachment Deleted" },
        { value: WebhookEventType.MEMBER_ADDED, label: "Member Added" },
        { value: WebhookEventType.MEMBER_REMOVED, label: "Member Removed" },
        { value: WebhookEventType.PROJECT_UPDATED, label: "Project Updated" },
    ];

    const allEventValues = eventOptions.map(opt => opt.value);
    const isAllSelected = (form.watch("events") || []).length === allEventValues.length;

    return (
        <ResponsiveModal open={isOpen} onOpenChange={close}>
            <div className="p-4 sm:p-7">
                <div className="flex flex-col gap-y-1 mb-6">
                    <h2 className="text-xl font-bold">Edit Webhook</h2>
                    <p className="text-sm text-muted-foreground">
                        Update your webhook configuration.
                    </p>
                </div>
                <DottedSeparator className="mb-6" />
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="enabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Enabled</FormLabel>
                                        <FormDescription>
                                            Receive events at this URL.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Webhook name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payload URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://example.com/webhook" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="secret"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Secret (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Leave blank to keep existing or enter new secret.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <FormLabel>Events</FormLabel>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="all-events"
                                        checked={isAllSelected}
                                        onCheckedChange={(checked) => {
                                            form.setValue("events", checked ? allEventValues : []);
                                        }}
                                    />
                                    <label
                                        htmlFor="all-events"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        All Events
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-md p-4 bg-muted/5 max-h-[250px] overflow-y-auto">
                                {eventOptions.map((option) => (
                                    <FormField
                                        key={option.value}
                                        control={form.control}
                                        name="events"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(option.value)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), option.value])
                                                                : field.onChange(
                                                                    field.value?.filter((value) => value !== option.value)
                                                                );
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-sm font-normal">
                                                    {option.label}
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={close}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </ResponsiveModal>
    );
};
