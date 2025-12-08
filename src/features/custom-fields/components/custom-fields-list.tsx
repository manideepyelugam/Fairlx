"use client";

import { Sliders, Plus, Settings } from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { useGetCustomFields } from "../api/use-get-custom-fields";
import { useCreateCustomFieldModal } from "../hooks/use-create-custom-field-modal";
import { CustomFieldType } from "../types";

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  [CustomFieldType.TEXT]: "Text",
  [CustomFieldType.TEXTAREA]: "Text Area",
  [CustomFieldType.NUMBER]: "Number",
  [CustomFieldType.CURRENCY]: "Currency",
  [CustomFieldType.DATE]: "Date",
  [CustomFieldType.DATETIME]: "Date & Time",
  [CustomFieldType.SELECT]: "Single Select",
  [CustomFieldType.MULTI_SELECT]: "Multi Select",
  [CustomFieldType.CHECKBOX]: "Checkbox",
  [CustomFieldType.URL]: "URL",
  [CustomFieldType.EMAIL]: "Email",
  [CustomFieldType.USER]: "User",
  [CustomFieldType.USERS]: "Users",
  [CustomFieldType.PERCENTAGE]: "Percentage",
  [CustomFieldType.LABELS]: "Labels",
};

interface CustomFieldsListProps {
  spaceId?: string;
  projectId?: string;
}

export const CustomFieldsList = ({ spaceId, projectId }: CustomFieldsListProps) => {
  const workspaceId = useWorkspaceId();
  const { open } = useCreateCustomFieldModal();
  const { data, isLoading } = useGetCustomFields({ workspaceId, spaceId, projectId });

  const fields = data?.documents ?? [];

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Custom Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sliders className="size-5" />
          Custom Fields
        </CardTitle>
        <Button variant="teritary" size="sm" onClick={open}>
          <Plus className="size-4 mr-1" />
          New Field
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sliders className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No custom fields yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add custom fields to capture additional data
            </p>
            <Button onClick={open}>
              <Plus className="size-4 mr-1" />
              Create Field
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field.$id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {FIELD_TYPE_LABELS[field.type as CustomFieldType] || field.type}
                      </Badge>
                      {field.isRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Key: {field.key}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {field.scope}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Settings className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
