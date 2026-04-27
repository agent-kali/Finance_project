"use client";

import { useRef, useState } from "react";
import { FileUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type FileDropzoneProps = {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
};

function validateFile(file: File): string | null {
  const isCsv =
    file.name.toLowerCase().endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel";

  if (!isCsv) return "Please choose a CSV file.";
  if (file.size > MAX_FILE_SIZE) return "CSV files must be 5MB or smaller.";
  return null;
}

export function FileDropzone({ onFileAccepted, disabled }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptFile = (file: File | undefined) => {
    if (!file || disabled) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onFileAccepted(file);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          acceptFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#b8956a]/40 bg-[#211d1a] px-6 py-8 text-center transition",
          isDragging && "border-[#b8956a] bg-[#b8956a]/10",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span className="mb-4 rounded-full border border-[#b8956a]/30 bg-[#b8956a]/10 p-4 text-[#b8956a]">
          <FileUp className="size-7" aria-hidden="true" />
        </span>
        <span className="text-base font-medium text-[#f7efe3]">
          Drop your CSV here, or browse
        </span>
        <span className="mt-2 max-w-sm text-sm text-[#f7efe3]/60">
          Revolut, Wise, or a generic CSV with date, amount, and description.
          Maximum file size is 5MB.
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-300">
          <AlertCircle className="size-4" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
