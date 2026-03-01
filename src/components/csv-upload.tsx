"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CsvUploadProps = {
  onFileLoaded: (csvText: string) => void;
};

export function CsvUpload({ onFileLoaded }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileName(file.name);
        onFileLoaded(text);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      const name = file?.name.toLowerCase() ?? "";
      if (file && (name.endsWith(".csv") || name.endsWith(".html") || name.endsWith(".htm"))) {
        readFile(file);
      }
    },
    [readFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        readFile(file);
      }
    },
    [readFile]
  );

  const handleClear = useCallback(() => {
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  return (
    <Card>
      <CardContent className="p-6">
        {fileName ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/40 p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">{fileName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                inputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
          >
            <Upload
              className={`h-10 w-10 ${
                isDragging ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <p className="text-center text-sm text-muted-foreground">
              Drag &amp; drop your MT5 report here (HTML or CSV), or click to browse
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.html,.htm"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
