"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Sliders, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { cn } from "@/lib/utils";
import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createCustomFieldSchema } from "../schemas";
import { useCreateCustomField } from "../api/use-create-custom-field";
import { CustomFieldType, CustomFieldScope } from "../types";

interface CreateCustomFieldFormProps {
  onCancel?: () => void;
  spaceId?: string;
  projectId?: string;
}

const FIELD_TYPE_OPTIONS = [
  { value: CustomFieldType.TEXT, label: "Text", description: "Single line text" },
  { value: CustomFieldType.TEXTAREA, label: "Text Area", description: "Multi-line text" },
  { value: CustomFieldType.NUMBER, label: "Number", description: "Numeric value" },
  { value: CustomFieldType.CURRENCY, label: "Currency", description: "Money value" },
  { value: CustomFieldType.DATE, label: "Date", description: "Date picker" },
  { value: CustomFieldType.DATETIME, label: "Date & Time", description: "Date and time" },
  { value: CustomFieldType.SELECT, label: "Single Select", description: "Dropdown with one choice" },
  { value: CustomFieldType.MULTI_SELECT, label: "Multi Select", description: "Multiple choices" },
  { value: CustomFieldType.CHECKBOX, label: "Checkbox", description: "Yes/No value" },
  { value: CustomFieldType.URL, label: "URL", description: "Web link" },
  { value: CustomFieldType.EMAIL, label: "Email", description: "Email address" },
  { value: CustomFieldType.USER, label: "User", description: "Team member" },
  { value: CustomFieldType.LABELS, label: "Labels", description: "Tag list" },
];

export const CreateCustomFieldForm = ({ onCancel, spaceId, projectId }: CreateCustomFieldFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useCreateCustomField();
  const [fieldType, setFieldType] = useState<CustomFieldType>(CustomFieldType.TEXT);

  const form = useForm<z.infer<typeof createCustomFieldSchema>>({
    resolver: zodResolver(createCustomFieldSchema.omit({ workspaceId: true })),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      type: CustomFieldType.TEXT,
      scope: projectId ? CustomFieldScope.PROJECT : spaceId ? CustomFieldScope.SPACE : CustomFieldScope.WORKSPACE,
      isRequired: false,
      showInList: true,
      showInCard: false,
      options: [],
    },
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: "options",
  });

  // Auto-generate key from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    
    const key = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .substring(0, 30);
    
    if (!form.getValues("key")) {
      form.setValue("key", key);
    }
  };

  const handleTypeChange = (type: CustomFieldType) => {
    setFieldType(type);
    form.setValue("type", type);
    
    // Add default options for select types
    if (type === CustomFieldType.SELECT || type === CustomFieldType.MULTI_SELECT) {
      if (optionFields.length === 0) {
        appendOption({ id: crypto.randomUUID(), value: "Option 1", color: "#6366f1", position: 0 });
        appendOption({ id: crypto.randomUUID(), value: "Option 2", color: "#22c55e", position: 1 });
      }
    }
  };

  const onSubmit = (values: z.infer<typeof createCustomFieldSchema>) => {
    mutate(
      { 
        json: {
          ...values,
          workspaceId,
          spaceId: spaceId || undefined,
          projectId: projectId || undefined,
        }
      },
      {
        onSuccess: () => {
          form.reset();
          onCancel?.();
        },
      }
    );
  };

  const showOptionsSection = fieldType === CustomFieldType.SELECT || fieldType === CustomFieldType.MULTI_SELECT;
  const showNumberSection = fieldType === CustomFieldType.NUMBER || fieldType === CustomFieldType.CURRENCY;

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sliders className="size-5" />
          Create Custom Field
        </CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Story Points, Sprint Goal" 
                        {...field}
                        onChange={handleNameChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Key</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., story_points" 
                        {...field}
                        className="lowercase"
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier used in API and filters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Type</FormLabel>
                    <Select 
                      onValueChange={(value) => handleTypeChange(value as CustomFieldType)} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FIELD_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Help text for this field" 
                        className="resize-none"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showOptionsSection && (
                <>
                  <DottedSeparator className="py-2" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium">Options</h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => appendOption({ 
                          id: crypto.randomUUID(), 
                          value: `Option ${optionFields.length + 1}`, 
                          color: "#6366f1", 
                          position: optionFields.length 
                        })}
                      >
                        <Plus className="size-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {optionFields.map((option, index) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            type="color"
                            {...form.register(`options.${index}.color`)}
                            className="size-8 rounded border cursor-pointer"
                          />
                          <Input
                            {...form.register(`options.${index}.value`)}
                            placeholder="Option value"
                            className="flex-1"
                          />
                          {optionFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(index)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {showNumberSection && (
                <>
                  <DottedSeparator className="py-2" />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Value</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Value</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="100"
                              {...field}
                              onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              <DottedSeparator className="py-2" />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Required field</FormLabel>
                        <FormDescription>
                          Users must fill this field when creating items
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="showInList"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Show in list view</FormLabel>
                        <FormDescription>
                          Display as a column in list/table views
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="showInCard"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Show on card</FormLabel>
                        <FormDescription>
                          Display on Kanban board cards
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DottedSeparator className="py-7" />

            <div className="flex items-center justify-between">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={onCancel}
                disabled={isPending}
                className={cn(!onCancel && "invisible")}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isPending}>
                Create Field
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
