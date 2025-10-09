import { cn } from "@/lib/utils";

interface SeparatorProps {
  className?: string;
  color?: string;
  thickness?: string;
  direction?: "horizontal" | "vertical";
}

export const Separator = ({
  className,
  color = "#D4D4D8",
  thickness = "2px",
  direction = "horizontal",
}: SeparatorProps) => {
  const isHorizontal = direction === "horizontal";
  return (
    <div
      className={cn(
        isHorizontal ? "w-full" : "h-full",
        className
      )}
      style={{
        backgroundColor: color,
        width: isHorizontal ? "100%" : thickness,
        height: isHorizontal ? thickness : "100%",
      }}
    />
  );
};
