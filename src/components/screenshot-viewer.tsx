"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ScreenshotViewerProps {
  screenshots: { id: string; url: string }[];
}

export function ScreenshotViewer({ screenshots }: ScreenshotViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (screenshots.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <ImageOff className="h-4 w-4" />
        <span>No screenshots</span>
      </div>
    );
  }

  const handlePrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === 0 ? screenshots.length - 1 : selectedIndex - 1
      );
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === screenshots.length - 1 ? 0 : selectedIndex + 1
      );
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {screenshots.slice(0, 2).map((screenshot, index) => (
          <button
            key={screenshot.id}
            type="button"
            className="group relative aspect-video overflow-hidden rounded-lg border bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setSelectedIndex(index)}
          >
            <Image
              src={screenshot.url}
              alt={`Trade screenshot ${index + 1}`}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 300px"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null);
        }}
      >
        <DialogContent className="max-w-4xl p-2 sm:p-4">
          <DialogTitle className="sr-only">
            Screenshot {selectedIndex !== null ? selectedIndex + 1 : ""} of{" "}
            {screenshots.length}
          </DialogTitle>
          {selectedIndex !== null && (
            <div className="relative flex items-center justify-center">
              {screenshots.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 z-10"
                  onClick={handlePrev}
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}

              <div className="relative w-full aspect-video">
                <Image
                  src={screenshots[selectedIndex].url}
                  alt={`Trade screenshot ${selectedIndex + 1}`}
                  fill
                  className="object-contain rounded-md"
                  sizes="(max-width: 768px) 100vw, 900px"
                  priority
                />
              </div>

              {screenshots.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 z-10"
                  onClick={handleNext}
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}

          {screenshots.length > 1 && selectedIndex !== null && (
            <p className="text-center text-sm text-muted-foreground">
              {selectedIndex + 1} / {screenshots.length}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
