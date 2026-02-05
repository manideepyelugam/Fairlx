"use client"

import { MultiSelect, Option } from "@/components/ui/multi-select-simple"
import { Users } from "lucide-react"

interface TeamMultiSelectProps {
  teamOptions: { id: string; name: string; color?: string; projectName?: string }[]
  selectedTeamIds: string[]
  onTeamsChange: (teamIds: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const TeamMultiSelect = ({
  teamOptions,
  selectedTeamIds,
  onTeamsChange,
  placeholder = "Select teams...",
  disabled = false,
  className,
}: TeamMultiSelectProps) => {
  const options: Option[] = teamOptions.map((team) => ({
    label: team.projectName ? `${team.name} (${team.projectName})` : team.name,
    value: team.id,
    icon: ({ className: iconClassName }: { className?: string }) => (
      <div 
        className={`flex items-center justify-center rounded ${iconClassName}`}
        style={{ backgroundColor: team.color || '#6366f1' }}
      >
        <Users className="size-3 text-white" />
      </div>
    ),
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedTeamIds}
      onChange={onTeamsChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
};
