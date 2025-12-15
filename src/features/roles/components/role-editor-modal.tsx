"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PERMISSIONS } from "@/lib/permissions";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    permissions: z.array(z.string()),
});

interface RoleEditorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: {
        $id: string;
        name: string;
        permissions: string[];
    } | null;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    isLoading?: boolean;
}

export const RoleEditorModal = ({
    open,
    onOpenChange,
    initialData,
    onSubmit,
    isLoading,
}: RoleEditorModalProps) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            permissions: [],
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                permissions: initialData.permissions,
            });
        } else {
            form.reset({
                name: "",
                permissions: [],
            });
        }
    }, [initialData, form, open]);

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
    };

    // Group permissions for better UI
    const groupedPermissions = Object.entries(PERMISSIONS).reduce((acc, [key, value]) => {
        const group = key.split("_")[0]; // e.g. WORKSPACE, SPRINTS, ...
        if (!acc[group]) acc[group] = [];
        acc[group].push({ label: key, value });
        return acc;
    }, {} as Record<string, { label: string; value: string }[]>);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Role" : "Create Role"}</DialogTitle>
                    <DialogDescription>
                        Configure role details and permissions.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4 flex-1 flex flex-col min-h-0"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. QA Engineer" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex-1 min-h-0 border rounded-md p-4">
                            <div className="mb-2 font-medium text-sm">Permissions</div>
                            <ScrollArea className="h-[300px] pr-4">
                                <FormField
                                    control={form.control}
                                    name="permissions"
                                    render={() => (
                                        <div className="space-y-6">
                                            {Object.entries(groupedPermissions).map(([group, permissions]) => (
                                                <div key={group} className="space-y-3">
                                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        {group}
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {permissions.map((permission) => (
                                                            <FormField
                                                                key={permission.label}
                                                                control={form.control}
                                                                name="permissions"
                                                                render={({ field }) => {
                                                                    return (
                                                                        <FormItem
                                                                            key={permission.label}
                                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                                        >
                                                                            <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value?.includes(permission.value)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        return checked
                                                                                            ? field.onChange([...field.value, permission.value])
                                                                                            : field.onChange(
                                                                                                field.value?.filter(
                                                                                                    (value) => value !== permission.value
                                                                                                )
                                                                                            );
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <div className="space-y-1 leading-none">
                                                                                <FormLabel className="text-sm font-normal cursor-pointer">
                                                                                    {permission.label.replace(/_/g, " ")}
                                                                                </FormLabel>
                                                                            </div>
                                                                        </FormItem>
                                                                    );
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <Separator />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                            </ScrollArea>
                        </div>

                        <DialogFooter className="mt-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                                {initialData ? "Save Changes" : "Create Role"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
