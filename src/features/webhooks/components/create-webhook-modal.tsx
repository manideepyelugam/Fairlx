"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ResponsiveModal } from "@/components/responsive-modal";
import { useCreateWebhookModal } from "../hooks/use-create-webhook-modal";
import { createWebhookSchema } from "../server/validations";
import { useCreateWebhook } from "../api/use-create-webhook";
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
import { DottedSeparator } from "@/components/dotted-separator";

interface CreateWebhookModalProps {
    projectId: string;
}

export const CreateWebhookModal = ({ projectId }: CreateWebhookModalProps) => {
    const { isOpen, close } = useCreateWebhookModal();
    const { mutate, isPending } = useCreateWebhook();

    const form = useForm<z.infer<typeof createWebhookSchema>>({
        resolver: zodResolver(createWebhookSchema),
        defaultValues: {
            name: "",
            url: "",
            events: [WebhookEventType.TASK_CREATED, WebhookEventType.TASK_UPDATED],
            secret: "",
            enabled: true,
        },
    });

    const onSubmit = (values: z.infer<typeof createWebhookSchema>) => {
        mutate({
            json: {
                ...values,
                projectId,
            },
        }, {
            onSuccess: () => {
                close();
                form.reset();
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
                    <h2 className="text-xl font-bold">Add Webhook</h2>
                    <p className="text-sm text-muted-foreground">
                        Configure a URL to receive project events.
                    </p>
                </div>
                <DottedSeparator className="mb-6" />
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Discord Alert, Custom Bot, etc." {...field} />
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
                                    <FormDescription>
                                        The endpoint where events will be sent via POST.
                                    </FormDescription>
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
                                        Used to generate HMAC signatures for security.
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
                                                                ? field.onChange([...field.value, option.value])
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
                                Create Webhook
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </ResponsiveModal>
    );
};
