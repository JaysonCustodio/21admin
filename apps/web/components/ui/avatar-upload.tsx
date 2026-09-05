"use client";

import { useRef, type ChangeEvent } from "react";
import { Camera, Loader2 } from "lucide-react";

export function AvatarUpload({
  imageUrl,
  fallbackText,
  onFileSelected,
  isUploading = false,
  size = 72,
  shape = "circle",
  label = "Photo",
  helpText = "JPEG, PNG, WebP or GIF. Max 5MB.",
}: {
  imageUrl: string | null;
  fallbackText: string;
  onFileSelected: (file: File) => void;
  isUploading?: boolean;
  size?: number;
  shape?: "circle" | "square";
  label?: string;
  helpText?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`group relative shrink-0 ${shapeClass} focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2`}
        style={{ width: size, height: size }}
        aria-label={`Upload ${label.toLowerCase()}`}
      >
        <div
          className={`h-full w-full overflow-hidden ${shapeClass} bg-slate-100 ring-1 ring-slate-200 transition group-hover:ring-primary/40 dark:bg-slate-700 dark:ring-slate-600`}
          style={{ width: size, height: size }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-400 dark:text-slate-500">
              {fallbackText}
            </div>
          )}
        </div>

        <div className={`absolute inset-0 flex items-center justify-center ${shapeClass} bg-slate-900/0 transition group-hover:bg-slate-900/40`}>
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
          )}
        </div>

        <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-sm dark:border-slate-800">
          <Camera className="h-3 w-3" />
        </span>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </button>

      <div className="text-sm">
        <p className="font-medium text-slate-700 dark:text-slate-300">{isUploading ? "Uploading…" : label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{helpText}</p>
      </div>
    </div>
  );
}
