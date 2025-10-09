"use client"

import { MultiSelect, Option } from "@/components/ui/multi-select-simple"
import { MemberAvatar } from "@/features/members/components/member-avatar"

interface AssigneeMultiSelectProps {
  memberOptions: { id: string; name: string; imageUrl?: string | null }[]
  selectedAssigneeIds: string[]
  onAssigneesChange: (assigneeIds: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const AssigneeMultiSelect = ({
  memberOptions,
  selectedAssigneeIds,
  onAssigneesChange,
  placeholder = "Select assignees...",
  disabled = false,
  className,
}: AssigneeMultiSelectProps) => {
  const options: Option[] = memberOptions.map((member) => ({
    label: member.name,
    value: member.id,
    icon: ({ className }: { className?: string }) => (
      <MemberAvatar
        className={className}
        name={member.name}
        imageUrl={member.imageUrl}
      />
    ),
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedAssigneeIds}
      onChange={onAssigneesChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
};