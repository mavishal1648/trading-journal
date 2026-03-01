"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { MAX_RATING } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function StarRating({ value, onChange, max = MAX_RATING }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= (hovered || value);

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={starValue === value}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            className={cn(
              "cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
              isFilled ? "text-yellow-400" : "text-muted-foreground/40"
            )}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              className={cn("h-6 w-6", isFilled && "fill-yellow-400")}
            />
          </button>
        );
      })}
    </div>
  );
}
