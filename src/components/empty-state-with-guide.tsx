"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateWithGuideProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  guide?: {
    title: string;
    steps: string[];
  };
}

export const EmptyStateWithGuide = ({
  icon: Icon,
  title,
  description,
  action,
  guide,
}: EmptyStateWithGuideProps) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          {description}
        </p>

        {action && (
          <Button onClick={action.onClick} size="lg" className="mb-6">
            {action.label}
          </Button>
        )}

        {guide && (
          <div className="w-full max-w-md bg-muted/50 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-sm mb-3">{guide.title}</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {guide.steps.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-semibold text-foreground">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
