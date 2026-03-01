"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_SCREENSHOTS } from "@/lib/constants";
import { convertToWebP } from "@/lib/utils/image";
import { cn } from "@/lib/utils";

interface ScreenshotUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  existingUrls?: string[];
  onRemoveExisting?: (url: string) => void;
}

export function ScreenshotUpload({
  value,
  onChange,
  existingUrls = [],
  onRemoveExisting,
}: ScreenshotUploadProps) {
  const [converting, setConverting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalCount = existingUrls.length + value.length;
  const canAdd = totalCount < MAX_SCREENSHOTS;

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const remaining = MAX_SCREENSHOTS - existingUrls.length - value.length;
      if (remaining <= 0) return;

      const toProcess = Array.from(files).slice(0, remaining);
      setConverting(true);

      try {
        const converted = await Promise.all(
          toProcess.map((file) => convertToWebP(file))
        );
        onChange([...value, ...converted]);
      } catch (error) {
        console.error("Failed to convert images:", error);
      } finally {
        setConverting(false);
      }
    },
    [value, existingUrls.length, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleRemoveNew = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canAdd && (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {converting ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {converting
              ? "Converting to WebP..."
              : "Drop screenshots here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {MAX_SCREENSHOTS - totalCount} remaining (PNG, JPG, WebP)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Previews */}
      {(existingUrls.length > 0 || value.length > 0) && (
        <div className="flex gap-3">
          {/* Existing screenshots */}
          {existingUrls.map((url) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt="Trade screenshot"
                className="h-24 w-36 rounded-md object-cover border"
              />
              {onRemoveExisting && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveExisting(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {/* New file previews */}
          {value.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-24 w-36 rounded-md object-cover border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveNew(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                {formatSize(file.size)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
