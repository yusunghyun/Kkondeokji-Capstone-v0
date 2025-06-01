"use client";

import type { Option, Question } from "@/shared/types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";

interface QuestionCardProps {
  question: Question;
  options: Option[];
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
}

export function QuestionCard({
  question,
  options,
  selectedOptionId,
  onSelect,
}: QuestionCardProps) {
  console.log("question", question);
  console.log("options", options);
  console.log("selectedOptionId", selectedOptionId);
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{question.text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {options.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className={cn(
                "flex items-center justify-start h-auto py-3 px-4 text-left",
                selectedOptionId === option.id && "border-primary bg-primary/10"
              )}
              onClick={() => onSelect(option.id)}
            >
              {option.icon && (
                <span className="mr-2 text-xl">{option.icon}</span>
              )}
              <span>{option.text}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
