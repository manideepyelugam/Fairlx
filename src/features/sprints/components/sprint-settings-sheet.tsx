"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { useUpdateSprint } from "../api/use-update-sprint";
import { useDeleteSprint } from "../api/use-delete-sprint";
import { Sprint, SprintStatus } from "../types";
import { useConfirm } from "@/hooks/use-confirm";
import { PERMISSIONS } from "@/lib/permissions";
import { usePermission } from "@/hooks/use-permission";
import { useProjectPermissions } from "@/hooks/use-project-permissions";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";

const formSchema = z.object({
    name: z.string().min(1, "Sprint name is required"),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    goal: z.string().optional(),
    status: z.nativeEnum(SprintStatus),
});

type FormData = z.infer<typeof formSchema>;

interface SprintSettingsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sprint: Sprint | null;
    projectId?: string;
    workspaceId?: string;
}

export const SprintSettingsSheet = ({
    open,
    onOpenChange,
    sprint,
    workspaceId,
}: SprintSettingsSheetProps) => {
    const { mutate: updateSprint, isPending: isUpdating } = useUpdateSprint();
    const { mutate: deleteSprint, isPending: isDeleting } = useDeleteSprint();
    const { can } = usePermission();
    
    const effectiveWorkspaceId = workspaceId || sprint?.workspaceId || "";
    
    // Project-level permissions
    const {
        canEditSprintsProject,
        canDeleteSprintsProject,
    } = useProjectPermissions({ 
        projectId: sprint?.projectId,
        workspaceId: effectiveWorkspaceId
    });
    
    // Check if user is workspace admin
    const { isAdmin } = useCurrentMember({ workspaceId: effectiveWorkspaceId });
    const isWorkspaceAdmin = isAdmin;
    
    // Effective permissions (admin OR project-level OR workspace-level)
    const canEditSprints = isWorkspaceAdmin || canEditSprintsProject || can(PERMISSIONS.SPRINT_UPDATE);
    const canDeleteSprints = isWorkspaceAdmin || canDeleteSprintsProject || can(PERMISSIONS.SPRINT_DELETE);

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Sprint",
        "Are you sure you want to delete this sprint? All work items will be moved to the backlog.",
        "destructive"
    );

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            goal: "",
            status: SprintStatus.PLANNED,
        },
    });

    useEffect(() => {
        if (sprint) {
            form.reset({
                name: sprint.name,
                startDate: sprint.startDate ? new Date(sprint.startDate) : undefined,
                endDate: sprint.endDate ? new Date(sprint.endDate) : undefined,
                goal: sprint.goal || "",
                status: sprint.status,
            });
        }
    }, [sprint, form]);

    const onSubmit = (values: FormData) => {
        if (!sprint) return;

        updateSprint(
            {
                param: { sprintId: sprint.$id },
                json: {
                    name: values.name,
                    startDate: values.startDate,
                    endDate: values.endDate,
                    goal: values.goal,
                    status: values.status,
                },
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    const handleDelete = async () => {
        if (!sprint) return;

        const ok = await confirmDelete();
        if (!ok) return;

        deleteSprint(
            { param: { sprintId: sprint.$id } },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <>
            <DeleteDialog />
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Sprint Settings</SheetTitle>
                        <SheetDescription>
                            Configure sprint details, duration, and goals.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sprint Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Sprint Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Start Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-4 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "MMM do yyyy")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>End Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-4 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "MMM do yyyy")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) =>
                                                                form.getValues("startDate")
                                                                    ? date < form.getValues("startDate")!
                                                                    : false
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={SprintStatus.PLANNED}>Planned</SelectItem>
                                                    <SelectItem value={SprintStatus.ACTIVE}>Active</SelectItem>
                                                    <SelectItem value={SprintStatus.COMPLETED}>Completed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="goal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sprint Goal</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="What is the main goal of this sprint?"
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center justify-between pt-4">
                                    {canDeleteSprints ? (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            disabled={isDeleting || isUpdating}
                                            onClick={handleDelete}
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                "Delete Sprint"
                                            )}
                                        </Button>
                                    ) : (
                                        <div /> // Spacer if delete button is hidden
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => onOpenChange(false)}
                                            disabled={isUpdating}
                                        >
                                            Cancel
                                        </Button>
                                        {canEditSprints && (
                                            <Button type="submit" disabled={isUpdating}>
                                                {isUpdating ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    "Save Changes"
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};
